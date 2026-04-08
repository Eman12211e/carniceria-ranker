-- Butcher verification flow: phone OTP + address confirmation

-- Verification requests table
CREATE TABLE verification_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  address_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active request per user per shop
  UNIQUE (user_id, shop_id)
);

CREATE INDEX idx_verification_pending ON verification_requests (status) WHERE status = 'pending';

-- RLS for verification_requests
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own verification requests"
  ON verification_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all verification requests"
  ON verification_requests FOR ALL
  USING (is_admin());

-- RPC: Submit a shop claim request
CREATE OR REPLACE FUNCTION request_shop_claim(
  p_shop_id UUID,
  p_phone TEXT
)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Check shop exists and isn't already claimed
  IF NOT EXISTS (SELECT 1 FROM shops WHERE id = p_shop_id AND claimed = FALSE) THEN
    RAISE EXCEPTION 'Shop does not exist or is already claimed';
  END IF;

  -- Create verification request
  INSERT INTO verification_requests (user_id, shop_id, phone)
  VALUES (auth.uid(), p_shop_id, p_phone)
  ON CONFLICT (user_id, shop_id) DO UPDATE
    SET phone = EXCLUDED.phone,
        status = 'pending',
        otp_verified = FALSE,
        address_confirmed = FALSE,
        updated_at = now()
  RETURNING id INTO v_request_id;

  -- Update user's role to butcher (pending verification)
  UPDATE profiles SET role = 'butcher' WHERE id = auth.uid();

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Admin approves a shop claim
CREATE OR REPLACE FUNCTION approve_shop_claim(p_request_id UUID)
RETURNS void AS $$
DECLARE
  v_request verification_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM verification_requests WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Require both OTP and address confirmed
  IF NOT v_request.otp_verified THEN
    RAISE EXCEPTION 'Phone OTP not yet verified';
  END IF;

  -- Mark request approved
  UPDATE verification_requests
  SET status = 'approved', reviewed_by = auth.uid(), updated_at = now()
  WHERE id = p_request_id;

  -- Claim the shop
  UPDATE shops
  SET claimed = TRUE, owner_id = v_request.user_id, updated_at = now()
  WHERE id = v_request.shop_id;

  -- Verify the user
  UPDATE profiles
  SET verified = TRUE, phone = v_request.phone, updated_at = now()
  WHERE id = v_request.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
