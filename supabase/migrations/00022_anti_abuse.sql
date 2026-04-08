-- Anti-abuse: fake-shop and spam defenses
-- Week 5 Risk Analyst deliverable

-- Rate limiting on shop creation (prevent mass fake shop seeding)
CREATE TABLE rate_limits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,   -- 'shop_create', 'price_submit', 'review_create', 'photo_upload'
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  count       INT NOT NULL DEFAULT 1,

  UNIQUE (user_id, action, window_start)
);

-- RPC: check and increment rate limit (returns TRUE if allowed)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action TEXT,
  p_max_per_hour INT DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_count INT;
  v_window TIMESTAMPTZ := date_trunc('hour', now());
BEGIN
  -- Upsert counter
  INSERT INTO rate_limits (user_id, action, window_start, count)
  VALUES (v_user_id, p_action, v_window, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_current_count;

  RETURN v_current_count <= p_max_per_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limits per action:
-- shop_create: 2/hour (nobody legitimately creates more than 2 shops/hour)
-- price_submit: 50/hour (butcher batch uploading)
-- review_create: 10/hour
-- photo_upload: 20/hour

-- Suspicious activity log
CREATE TABLE abuse_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB,
  severity    TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abuse_unresolved ON abuse_log (resolved) WHERE resolved = FALSE;

-- Trigger: log when a shop is created by unverified user
CREATE OR REPLACE FUNCTION log_shop_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_verified BOOLEAN;
  v_user_role user_role;
BEGIN
  SELECT verified, role INTO v_user_verified, v_user_role
  FROM profiles WHERE id = NEW.owner_id;

  -- Log all shop creations for audit trail
  INSERT INTO abuse_log (user_id, action, details, severity)
  VALUES (
    NEW.owner_id,
    'shop_create',
    jsonb_build_object(
      'shop_name', NEW.name,
      'address', NEW.address,
      'city', NEW.city,
      'user_verified', COALESCE(v_user_verified, FALSE),
      'user_role', COALESCE(v_user_role::text, 'unknown')
    ),
    CASE
      WHEN COALESCE(v_user_verified, FALSE) = FALSE THEN 'medium'
      ELSE 'low'
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shop_created
  AFTER INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION log_shop_creation();

-- Trigger: auto-flag reviews with suspicious patterns
CREATE OR REPLACE FUNCTION check_review_spam()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count INT;
BEGIN
  -- Count reviews by this user in last hour
  SELECT count(*) INTO v_recent_count
  FROM reviews
  WHERE user_id = NEW.user_id
    AND created_at >= now() - INTERVAL '1 hour';

  -- Flag if > 5 reviews in an hour (suspicious)
  IF v_recent_count > 5 THEN
    INSERT INTO abuse_log (user_id, action, details, severity)
    VALUES (
      NEW.user_id,
      'review_spam',
      jsonb_build_object(
        'review_count_last_hour', v_recent_count,
        'shop_id', NEW.shop_id,
        'rating', NEW.rating
      ),
      'high'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_review_spam();

-- Clean up old rate limit records (older than 24h)
SELECT cron.schedule(
  'clean-rate-limits',
  '0 5 * * *',
  $$DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '24 hours'$$
);
