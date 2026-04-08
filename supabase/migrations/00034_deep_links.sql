-- Deep link tracking for share card opens
-- Migration: 00034_deep_links.sql

-- Create deep_link_opens table
CREATE TABLE deep_link_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type TEXT NOT NULL CHECK (link_type IN ('share_card', 'price_alert', 'weekly_email')),
  target_shop_id UUID REFERENCES shops(id),
  target_cut_id UUID REFERENCES meat_cuts(id),
  referrer_user_id UUID REFERENCES profiles(id),
  opened_by UUID REFERENCES profiles(id),
  opened_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deep_link_opens ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access on deep_link_opens"
  ON deep_link_opens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert their own opens
CREATE POLICY "Users can insert own deep link opens"
  ON deep_link_opens
  FOR INSERT
  TO authenticated
  WITH CHECK (opened_by = auth.uid());

-- Indexes for common queries
CREATE INDEX idx_deep_link_opens_shop_opened
  ON deep_link_opens(target_shop_id, opened_at);

CREATE INDEX idx_deep_link_opens_referrer_opened
  ON deep_link_opens(referrer_user_id, opened_at);

-- Function to log a deep link open and fire an analytics event
CREATE OR REPLACE FUNCTION log_deep_link_open(
  p_link_type TEXT,
  p_shop_id UUID DEFAULT NULL,
  p_cut_id UUID DEFAULT NULL,
  p_referrer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_id UUID;
BEGIN
  INSERT INTO deep_link_opens (link_type, target_shop_id, target_cut_id, referrer_user_id, opened_by)
  VALUES (p_link_type, p_shop_id, p_cut_id, p_referrer_id, auth.uid())
  RETURNING id INTO v_open_id;

  -- Also log as analytics event
  INSERT INTO analytics_events (user_id, event, properties)
  VALUES (
    auth.uid(),
    'deep_link_opened',
    json_build_object(
      'link_type', p_link_type,
      'shop_id', p_shop_id,
      'cut_id', p_cut_id,
      'referrer_id', p_referrer_id,
      'open_id', v_open_id
    )::jsonb
  );

  RETURN v_open_id;
END;
$$;
