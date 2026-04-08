-- 00031_data_retention_cron.sql
-- Automated data retention cleanup per moderation policy

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_photos_deleted INT;
  v_analytics_deleted INT;
  v_rate_limits_deleted INT;
BEGIN
  -- Delete rejected photos older than 30 days
  DELETE FROM photos
   WHERE moderation = 'rejected'
     AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_photos_deleted = ROW_COUNT;

  -- Delete analytics events older than 90 days
  DELETE FROM analytics_events
   WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_analytics_deleted = ROW_COUNT;

  -- Delete expired rate limit windows (from migration 00022)
  DELETE FROM rate_limits
   WHERE window_start < now() - interval '24 hours';
  GET DIAGNOSTICS v_rate_limits_deleted = ROW_COUNT;

  RETURN json_build_object(
    'photos_deleted', v_photos_deleted,
    'analytics_deleted', v_analytics_deleted,
    'rate_limits_deleted', v_rate_limits_deleted,
    'run_at', now()
  );
END;
$$;

-- Schedule daily cleanup at 4 AM
SELECT cron.schedule('data-retention-cleanup', '0 4 * * *', $$SELECT cleanup_expired_data()$$);
