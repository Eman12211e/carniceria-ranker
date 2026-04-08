-- Expansion readiness dashboard RPC
-- Migration: 00033_expansion_readiness.sql

CREATE OR REPLACE FUNCTION get_expansion_readiness(p_city TEXT DEFAULT 'Merced')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mau BIGINT;
  v_verified_shops BIGINT;
  v_total_shops BIGINT;
  v_fresh_shops BIGINT;
  v_pct_fresh NUMERIC;
  v_total_prices BIGINT;
  v_active_butchers BIGINT;
  v_shares BIGINT;
  v_generates BIGINT;
  v_share_rate NUMERIC;
  v_ready BOOLEAN;
BEGIN
  -- Monthly active users (last 30 days)
  SELECT COUNT(DISTINCT user_id)
  INTO v_mau
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND (
      properties->>'city' ILIKE p_city
      OR NOT EXISTS (
        SELECT 1 FROM analytics_events ae2
        WHERE ae2.created_at >= NOW() - INTERVAL '30 days'
          AND ae2.properties->>'city' IS NOT NULL
        LIMIT 1
      )
    );

  -- Verified active shops in this city
  SELECT COUNT(*)
  INTO v_verified_shops
  FROM shops
  WHERE verified = TRUE
    AND active = TRUE
    AND city ILIKE p_city;

  -- Total active shops for freshness calculation
  SELECT COUNT(*)
  INTO v_total_shops
  FROM shop_freshness sf
  JOIN shops s ON sf.shop_id = s.id
  WHERE s.city ILIKE p_city
    AND s.active = TRUE;

  -- Fresh or aging shops
  SELECT COUNT(*)
  INTO v_fresh_shops
  FROM shop_freshness sf
  JOIN shops s ON sf.shop_id = s.id
  WHERE s.city ILIKE p_city
    AND s.active = TRUE
    AND sf.freshness_status IN ('fresh', 'aging');

  -- Percentage fresh
  v_pct_fresh := CASE
    WHEN v_total_shops > 0 THEN ROUND((v_fresh_shops::NUMERIC / v_total_shops) * 100, 1)
    ELSE 0
  END;

  -- Total current prices
  SELECT COUNT(*)
  INTO v_total_prices
  FROM current_prices;

  -- Active butchers (shop owners) in this city
  SELECT COUNT(DISTINCT owner_id)
  INTO v_active_butchers
  FROM shops
  WHERE owner_id IS NOT NULL
    AND active = TRUE
    AND city ILIKE p_city;

  -- Share rate: shared / generated in last 30 days
  SELECT COUNT(*) FILTER (WHERE event = 'share_card_generated')
  INTO v_generates
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(*) FILTER (WHERE event = 'share_card_shared')
  INTO v_shares
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '30 days';

  v_share_rate := CASE
    WHEN v_generates > 0 THEN ROUND((v_shares::NUMERIC / v_generates) * 100, 1)
    ELSE 0
  END;

  -- Check if all thresholds are met
  v_ready := (
    v_mau >= 500
    AND v_verified_shops >= 15
    AND v_pct_fresh >= 80
    AND v_share_rate >= 5
  );

  RETURN json_build_object(
    'city', p_city,
    'mau', v_mau,
    'verified_shops', v_verified_shops,
    'pct_fresh', v_pct_fresh,
    'total_prices', v_total_prices,
    'active_butchers', v_active_butchers,
    'share_rate', v_share_rate,
    'thresholds', json_build_object(
      'mau', 500,
      'verified_shops', 15,
      'pct_fresh', 80,
      'share_rate', 5
    ),
    'ready', v_ready
  );
END;
$$;
