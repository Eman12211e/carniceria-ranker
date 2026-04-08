-- Photo moderation enhancements (from Risk Analyst spec)
ALTER TABLE photos ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN NOT NULL DEFAULT FALSE;

-- RPC: admin moderates a photo (approve/reject)
CREATE OR REPLACE FUNCTION moderate_photo(
  p_photo_id UUID,
  p_action TEXT,           -- 'approved' or 'rejected'
  p_reject_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: must be approved or rejected';
  END IF;

  IF p_action = 'rejected' AND p_reject_reason IS NULL THEN
    RAISE EXCEPTION 'Reject reason is required';
  END IF;

  UPDATE photos
  SET moderation = p_action::moderation_status,
      moderated_by = auth.uid(),
      moderated_at = now(),
      reject_reason = p_reject_reason
  WHERE id = p_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: user reports a photo
CREATE OR REPLACE FUNCTION report_photo(p_photo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE photos
  SET report_count = report_count + 1,
      auto_flagged = CASE WHEN report_count + 1 >= 3 THEN TRUE ELSE auto_flagged END
  WHERE id = p_photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin queue view with priority ordering
CREATE OR REPLACE VIEW moderation_queue AS
SELECT
  p.id,
  p.user_id,
  pr.display_name AS uploader_name,
  p.shop_id,
  s.name AS shop_name,
  p.storage_path,
  p.report_count,
  p.auto_flagged,
  p.created_at
FROM photos p
JOIN shops s ON s.id = p.shop_id
LEFT JOIN profiles pr ON pr.id = p.user_id
WHERE p.moderation = 'pending'
ORDER BY
  p.auto_flagged DESC,
  p.report_count DESC,
  p.created_at ASC;

-- Storage bucket policy (applied via Supabase dashboard, documented here)
-- Bucket: shop-photos
-- Max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
