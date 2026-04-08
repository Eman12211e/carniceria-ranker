-- Pro feature gating in key RPCs
-- Migration: 00035_pro_feature_gating.sql

-- Function to check if a user has access to a given feature
CREATE OR REPLACE FUNCTION check_feature_access(p_user_id UUID, p_feature TEXT)
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

  -- If no profile found, deny access
  IF v_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Features requiring trial (with valid trial) or pro
  IF p_feature IN ('upload_price', 'analytics_dashboard', 'price_alerts_notify') THEN
    IF v_status = 'pro' THEN
      RETURN TRUE;
    END IF;
    IF v_status = 'trial' AND v_trial_ends > NOW() THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- Features requiring pro only
  IF p_feature IN ('priority_placement', 'custom_branding', 'pro_badge') THEN
    RETURN v_status = 'pro';
  END IF;

  -- Everything else is free
  RETURN TRUE;
END;
$$;

-- View for pro shops with subscription info
CREATE OR REPLACE VIEW pro_shops AS
SELECT
  s.*,
  p.subscription_status,
  CASE
    WHEN p.subscription_status = 'pro' THEN TRUE
    ELSE FALSE
  END AS is_pro
FROM shops s
JOIN profiles p ON s.owner_id = p.id
WHERE p.subscription_status IN ('trial', 'pro')
  AND s.active = TRUE;
