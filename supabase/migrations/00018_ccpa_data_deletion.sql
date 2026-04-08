-- CCPA compliance: data deletion mechanism
-- Users can request deletion of all their personal data.
-- This cascades through all tables with user references.

-- Deletion requests log (for audit trail — CCPA requires proof of deletion)
CREATE TABLE data_deletion_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL,  -- Not FK — user may already be deleted
  email       TEXT,
  phone       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  deleted_tables TEXT[] DEFAULT '{}'  -- Track what was actually deleted
);

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own deletion requests"
  ON data_deletion_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users create deletion requests"
  ON data_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all deletion requests"
  ON data_deletion_requests FOR ALL
  USING (is_admin());

-- RPC: Request full data deletion (CCPA "Right to Delete")
CREATE OR REPLACE FUNCTION request_data_deletion()
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_request_id UUID;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  -- Get user info before deletion
  SELECT phone INTO v_phone FROM profiles WHERE id = v_user_id;

  -- Create audit record
  INSERT INTO data_deletion_requests (user_id, phone)
  VALUES (v_user_id, v_phone)
  RETURNING id INTO v_request_id;

  -- Delete user data from all tables (order matters for FK constraints)
  DELETE FROM price_flags WHERE flagged_by = v_user_id;
  DELETE FROM photos WHERE user_id = v_user_id;
  DELETE FROM reviews WHERE user_id = v_user_id;
  DELETE FROM prices WHERE submitted_by = v_user_id;
  DELETE FROM verification_requests WHERE user_id = v_user_id;

  -- Disassociate shop ownership (don't delete the shop — other data depends on it)
  UPDATE shops SET owner_id = NULL, claimed = FALSE WHERE owner_id = v_user_id;

  -- Anonymize profile (keep row for FK integrity but scrub PII)
  UPDATE profiles
  SET display_name = '[deleted]',
      phone = NULL,
      updated_at = now()
  WHERE id = v_user_id;

  -- Mark request completed
  UPDATE data_deletion_requests
  SET status = 'completed',
      completed_at = now(),
      deleted_tables = ARRAY['price_flags', 'photos', 'reviews', 'prices', 'verification_requests', 'profiles (anonymized)']
  WHERE id = v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get user's data export (CCPA "Right to Know")
CREATE OR REPLACE FUNCTION export_my_data()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = v_user_id),
    'reviews', (SELECT json_agg(row_to_json(r)) FROM reviews r WHERE r.user_id = v_user_id),
    'photos', (SELECT json_agg(json_build_object('id', ph.id, 'shop_id', ph.shop_id, 'created_at', ph.created_at))
               FROM photos ph WHERE ph.user_id = v_user_id),
    'price_submissions', (SELECT json_agg(row_to_json(pr)) FROM prices pr WHERE pr.submitted_by = v_user_id),
    'price_flags', (SELECT json_agg(row_to_json(pf)) FROM price_flags pf WHERE pf.flagged_by = v_user_id),
    'verification_requests', (SELECT json_agg(row_to_json(vr)) FROM verification_requests vr WHERE vr.user_id = v_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
