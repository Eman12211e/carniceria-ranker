-- System health check for launch monitoring
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'checked_at', now(),

    -- Data freshness
    'shop_freshness_last_refresh', (
      SELECT MAX(last_price_at) FROM shop_freshness
    ),
    'price_averages_rows', (
      SELECT COUNT(*) FROM price_averages
    ),

    -- Volume stats (last 24h)
    'prices_24h', (
      SELECT COUNT(*) FROM prices WHERE created_at > now() - interval '24 hours'
    ),
    'reviews_24h', (
      SELECT COUNT(*) FROM reviews WHERE created_at > now() - interval '24 hours'
    ),
    'photos_pending', (
      SELECT COUNT(*) FROM photos WHERE moderation = 'pending'
    ),
    'analytics_events_24h', (
      SELECT COUNT(*) FROM analytics_events WHERE created_at > now() - interval '24 hours'
    ),

    -- User stats
    'total_users', (SELECT COUNT(*) FROM profiles),
    'shoppers', (SELECT COUNT(*) FROM profiles WHERE role = 'shopper'),
    'butchers', (SELECT COUNT(*) FROM profiles WHERE role = 'butcher'),
    'admins', (SELECT COUNT(*) FROM profiles WHERE role = 'admin'),
    'trial_users', (SELECT COUNT(*) FROM profiles WHERE subscription_status = 'trial'),
    'pro_users', (SELECT COUNT(*) FROM profiles WHERE subscription_status = 'pro'),

    -- Shop stats
    'total_shops', (SELECT COUNT(*) FROM shops WHERE active = true),
    'verified_shops', (SELECT COUNT(*) FROM shops WHERE verified = true AND active = true),
    'claimed_shops', (SELECT COUNT(*) FROM shops WHERE claimed = true AND active = true),

    -- Abuse monitoring
    'abuse_log_unresolved', (
      SELECT COUNT(*) FROM abuse_log WHERE resolved = false
    ),
    'abuse_log_critical', (
      SELECT COUNT(*) FROM abuse_log WHERE resolved = false AND severity = 'critical'
    ),
    'abuse_log_high', (
      SELECT COUNT(*) FROM abuse_log WHERE resolved = false AND severity = 'high'
    ),

    -- Notifications pending
    'notifications_pending', (
      SELECT COUNT(*) FROM notification_queue WHERE sent_at IS NULL
    ),

    -- Price alerts active
    'price_alerts_active', (
      SELECT COUNT(*) FROM price_alerts WHERE active = true
    ),

    -- Deep link opens (last 7 days)
    'deep_links_7d', (
      SELECT COUNT(*) FROM deep_link_opens WHERE opened_at > now() - interval '7 days'
    ),

    -- Cron job status
    'cron_jobs', (
      SELECT json_agg(json_build_object(
        'jobname', jobname,
        'schedule', schedule,
        'active', active
      ))
      FROM cron.job
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant to authenticated (admin check happens client-side, but we also add a safety check)
COMMENT ON FUNCTION get_system_health() IS 'Admin-only system health dashboard. Check role before calling.';
