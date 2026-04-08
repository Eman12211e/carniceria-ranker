-- Moderation queue refinements — Week 6
-- Auto-approve trusted uploaders, moderation metrics, bulk actions

-- Track trusted uploaders: 10+ approved photos, 0 rejections
CREATE OR REPLACE VIEW trusted_uploaders AS
SELECT
  p.user_id,
  COUNT(*) FILTER (WHERE p.moderation = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE p.moderation = 'rejected') AS rejected_count
FROM photos p
GROUP BY p.user_id
HAVING COUNT(*) FILTER (WHERE p.moderation = 'approved') >= 10
   AND COUNT(*) FILTER (WHERE p.moderation = 'rejected') = 0;

-- Auto-approve trigger: skip queue for trusted uploaders
CREATE OR REPLACE FUNCTION auto_approve_trusted_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM trusted_uploaders WHERE user_id = NEW.user_id) THEN
    NEW.moderation := 'approved';
    NEW.moderated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_photo_upload_check_trusted
  BEFORE INSERT ON photos
  FOR EACH ROW EXECUTE FUNCTION auto_approve_trusted_photo();

-- Bulk moderation RPC: approve/reject multiple photos at once
CREATE OR REPLACE FUNCTION bulk_moderate_photos(
  p_photo_ids UUID[],
  p_action TEXT,
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  IF p_action = 'rejected' AND p_reject_reason IS NULL THEN
    RAISE EXCEPTION 'Reject reason required';
  END IF;

  UPDATE photos
  SET moderation = p_action::moderation_status,
      moderated_by = auth.uid(),
      moderated_at = now(),
      reject_reason = CASE WHEN p_action = 'rejected' THEN p_reject_reason ELSE NULL END
  WHERE id = ANY(p_photo_ids)
    AND moderation = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Moderation metrics view (for dashboard stats)
CREATE OR REPLACE VIEW moderation_metrics AS
SELECT
  -- Photo queue
  COUNT(*) FILTER (WHERE moderation = 'pending') AS photos_pending,
  COUNT(*) FILTER (WHERE moderation = 'pending' AND auto_flagged = TRUE) AS photos_auto_flagged,
  COUNT(*) FILTER (WHERE moderation = 'pending' AND report_count >= 3) AS photos_reported,
  COUNT(*) FILTER (WHERE moderation = 'approved'
    AND moderated_at >= now() - INTERVAL '24 hours') AS photos_approved_24h,
  COUNT(*) FILTER (WHERE moderation = 'rejected'
    AND moderated_at >= now() - INTERVAL '24 hours') AS photos_rejected_24h,
  -- Median time to moderate (last 100 moderated photos)
  (SELECT EXTRACT(EPOCH FROM AVG(moderated_at - created_at)) / 3600
   FROM (SELECT moderated_at, created_at FROM photos
         WHERE moderated_at IS NOT NULL
         ORDER BY moderated_at DESC LIMIT 100) sub
  ) AS avg_hours_to_moderate
FROM photos;

-- Price flag metrics
CREATE OR REPLACE VIEW flag_metrics AS
SELECT
  COUNT(*) FILTER (WHERE resolved = FALSE) AS flags_pending,
  COUNT(*) FILTER (WHERE resolved = TRUE
    AND created_at >= now() - INTERVAL '7 days') AS flags_resolved_7d,
  -- Most flagged shops
  (SELECT json_agg(row_to_json(t))
   FROM (
     SELECT s.name AS shop_name, COUNT(*) AS flag_count
     FROM price_flags pf
     JOIN prices p ON p.id = pf.price_id
     JOIN shops s ON s.id = p.shop_id
     WHERE pf.resolved = FALSE
     GROUP BY s.name
     ORDER BY flag_count DESC
     LIMIT 5
   ) t
  ) AS top_flagged_shops
FROM price_flags;
