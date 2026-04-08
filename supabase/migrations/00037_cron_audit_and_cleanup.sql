-- Final cron job audit and registration
-- This migration ensures all scheduled jobs exist and are properly configured

-- 1. Create a cron job registry view for easy monitoring
CREATE OR REPLACE VIEW cron_job_registry AS
SELECT
  jobname,
  schedule,
  command,
  active,
  jobid
FROM cron.job
ORDER BY jobname;

-- 2. Ensure all expected cron jobs exist (idempotent — uses IF NOT EXISTS pattern)
DO $$
BEGIN
  -- Freshness refresh (hourly)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-shop-freshness') THEN
    PERFORM cron.schedule('refresh-shop-freshness', '0 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY shop_freshness');
  END IF;

  -- Price averages (hourly at :10)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-price-averages') THEN
    PERFORM cron.schedule('refresh-price-averages', '10 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY price_averages');
  END IF;

  -- Price averages by city (hourly at :15)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-price-averages-by-city') THEN
    PERFORM cron.schedule('refresh-price-averages-by-city', '15 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY price_averages_by_city');
  END IF;

  -- Price trends (hourly at :20)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-price-trends') THEN
    PERFORM cron.schedule('refresh-price-trends', '20 * * * *',
      'REFRESH MATERIALIZED VIEW CONCURRENTLY price_trends');
  END IF;

  -- Outlier hard delete (daily 3am)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hard-delete-outlier-prices') THEN
    PERFORM cron.schedule('hard-delete-outlier-prices', '0 3 * * *',
      'DELETE FROM prices WHERE is_outlier = true AND created_at < now() - interval ''30 days''');
  END IF;

  -- Data retention cleanup (daily 4am)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'data-retention-cleanup') THEN
    PERFORM cron.schedule('data-retention-cleanup', '0 4 * * *',
      'SELECT cleanup_expired_data()');
  END IF;

  -- Trial expiration (daily 6am)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-trials') THEN
    PERFORM cron.schedule('expire-trials', '0 6 * * *',
      'SELECT expire_trials()');
  END IF;

  -- Shop duplicate detection (weekly Sunday 3am)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'flag-shop-duplicates') THEN
    PERFORM cron.schedule('flag-shop-duplicates', '0 3 * * 0',
      'SELECT flag_potential_duplicates()');
  END IF;

  -- Weekly performance emails (Monday 9am)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-performance-emails') THEN
    PERFORM cron.schedule('weekly-performance-emails', '0 9 * * 1',
      'SELECT queue_weekly_emails()');
  END IF;

  -- Price alert checks (every 15 minutes)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-price-alerts') THEN
    PERFORM cron.schedule('check-price-alerts', '*/15 * * * *',
      'SELECT check_price_alerts()');
  END IF;
END
$$;

-- 3. Add comment for documentation
COMMENT ON VIEW cron_job_registry IS 'Read-only view of all scheduled cron jobs for monitoring';
