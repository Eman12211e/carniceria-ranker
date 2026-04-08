-- 00028_subscription_and_trial.sql
-- Add subscription/billing columns to profiles and trial management functions

-- Add subscription columns to profiles
ALTER TABLE profiles
  ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'trial', 'pro', 'expired')),
  ADD COLUMN trial_ends_at TIMESTAMPTZ NULL,
  ADD COLUMN stripe_customer_id TEXT NULL,
  ADD COLUMN subscription_expires_at TIMESTAMPTZ NULL;

-- Index for active subscription lookups
CREATE INDEX idx_profiles_active_subscriptions
  ON profiles (subscription_status)
  WHERE subscription_status IN ('trial', 'pro');

-- Check if a user has pro-level access (active pro or valid trial)
CREATE OR REPLACE FUNCTION check_pro_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_trial_ends TIMESTAMPTZ;
BEGIN
  SELECT subscription_status, trial_ends_at
    INTO v_status, v_trial_ends
    FROM profiles
   WHERE id = p_user_id;

  RETURN v_status = 'pro'
      OR (v_status = 'trial' AND v_trial_ends > now());
END;
$$;

-- Expire trials that have passed their end date
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Queue notifications for users whose trials are expiring
  INSERT INTO notification_queue (user_id, event_type, payload)
  SELECT id, 'trial_expired', jsonb_build_object(
    'trial_ends_at', trial_ends_at,
    'message', 'Your free trial has expired. Upgrade to Pro to keep premium features.'
  )
  FROM profiles
  WHERE subscription_status = 'trial'
    AND trial_ends_at <= now();

  -- Mark expired trials
  UPDATE profiles
     SET subscription_status = 'expired',
         updated_at = now()
   WHERE subscription_status = 'trial'
     AND trial_ends_at <= now();
END;
$$;

-- Schedule daily trial expiration check at 6 AM
SELECT cron.schedule('expire-trials', '0 6 * * *', $$SELECT expire_trials()$$);

-- Activate a 90-day trial for a free user
CREATE OR REPLACE FUNCTION activate_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE profiles
     SET subscription_status = 'trial',
         trial_ends_at = now() + interval '90 days',
         updated_at = now()
   WHERE id = p_user_id
     AND subscription_status = 'free';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- Activate pro subscription with Stripe customer ID
CREATE OR REPLACE FUNCTION activate_pro(p_user_id UUID, p_stripe_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
BEGIN
  UPDATE profiles
     SET subscription_status = 'pro',
         stripe_customer_id = p_stripe_id,
         updated_at = now()
   WHERE id = p_user_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- RLS: users can read their own subscription fields (profiles RLS already enabled)
-- Add policy for reading subscription data
CREATE POLICY profiles_read_own_subscription ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Stripe fields can only be updated by service_role (enforced by not granting
-- direct UPDATE on stripe_customer_id to authenticated users).
-- The activate_pro function uses SECURITY DEFINER to bypass RLS for writes.
REVOKE UPDATE (stripe_customer_id) ON profiles FROM authenticated;
