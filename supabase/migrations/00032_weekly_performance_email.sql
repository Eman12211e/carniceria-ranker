-- Weekly performance email data for butcher shop owners
-- Migration: 00032_weekly_performance_email.sql

-- Function to gather weekly performance metrics for a shop
CREATE OR REPLACE FUNCTION get_weekly_performance(p_shop_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_shop_name TEXT;
  v_owner_name TEXT;
  v_total_views BIGINT;
  v_total_searches BIGINT;
  v_share_cards BIGINT;
  v_price_count BIGINT;
  v_freshness TEXT;
  v_avg_rating NUMERIC;
  v_last_week_views BIGINT;
  v_top_cut TEXT;
BEGIN
  -- Shop and owner info
  SELECT s.name, p.display_name
  INTO v_shop_name, v_owner_name
  FROM shops s
  LEFT JOIN profiles p ON s.owner_id = p.id
  WHERE s.id = p_shop_id;

  -- Views this week
  SELECT COUNT(*)
  INTO v_total_views
  FROM analytics_events
  WHERE properties->>'shop_id' = p_shop_id::TEXT
    AND event = 'shop_viewed'
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Searches this week
  SELECT COUNT(*)
  INTO v_total_searches
  FROM analytics_events
  WHERE properties->>'shop_id' = p_shop_id::TEXT
    AND event = 'search_result_shown'
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Share cards generated this week
  SELECT COUNT(*)
  INTO v_share_cards
  FROM analytics_events
  WHERE properties->>'shop_id' = p_shop_id::TEXT
    AND event = 'share_card_generated'
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Current non-outlier price count
  SELECT COUNT(*)
  INTO v_price_count
  FROM prices
  WHERE shop_id = p_shop_id
    AND is_outlier = FALSE
    AND verified_at IS NOT NULL;

  -- Freshness status
  SELECT freshness_status
  INTO v_freshness
  FROM shop_freshness
  WHERE shop_id = p_shop_id;

  -- Average rating
  SELECT AVG(rating)
  INTO v_avg_rating
  FROM reviews
  WHERE shop_id = p_shop_id;

  -- Views last week (for week-over-week comparison)
  SELECT COUNT(*)
  INTO v_last_week_views
  FROM analytics_events
  WHERE properties->>'shop_id' = p_shop_id::TEXT
    AND event = 'shop_viewed'
    AND created_at >= NOW() - INTERVAL '14 days'
    AND created_at < NOW() - INTERVAL '7 days';

  -- Top cut (most viewed for this shop)
  SELECT properties->>'cut_name'
  INTO v_top_cut
  FROM analytics_events
  WHERE properties->>'shop_id' = p_shop_id::TEXT
    AND event = 'shop_viewed'
    AND properties->>'cut_name' IS NOT NULL
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY properties->>'cut_name'
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  result := json_build_object(
    'shop_name', v_shop_name,
    'owner_display_name', v_owner_name,
    'total_views', v_total_views,
    'total_searches', v_total_searches,
    'share_cards_generated', v_share_cards,
    'price_count', v_price_count,
    'freshness_status', v_freshness,
    'avg_rating', ROUND(COALESCE(v_avg_rating, 0), 2),
    'week_over_week_views', v_total_views - v_last_week_views,
    'top_cut', v_top_cut
  );

  RETURN result;
END;
$$;

-- Function to queue weekly performance emails for all eligible shop owners
CREATE OR REPLACE FUNCTION queue_weekly_emails()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_record RECORD;
  perf JSON;
BEGIN
  FOR shop_record IN
    SELECT s.id AS shop_id, s.owner_id
    FROM shops s
    JOIN profiles p ON s.owner_id = p.id
    WHERE s.owner_id IS NOT NULL
      AND p.subscription_status IN ('trial', 'pro')
      AND s.active = TRUE
  LOOP
    perf := get_weekly_performance(shop_record.shop_id);

    INSERT INTO notification_queue (user_id, type, payload)
    VALUES (
      shop_record.owner_id,
      'weekly_report',
      perf
    );
  END LOOP;
END;
$$;

-- Schedule weekly emails every Monday at 9am
SELECT cron.schedule(
  'weekly-performance-emails',
  '0 9 * * 1',
  $$SELECT queue_weekly_emails()$$
);
