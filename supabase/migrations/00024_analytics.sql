-- Analytics: share-card tracking, price trends, and usage events
-- Week 6 Backend deliverable

-- Generic analytics events table
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event       TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partition-friendly index (query by event type + time range)
CREATE INDEX idx_analytics_event ON analytics_events (event, created_at DESC);
CREATE INDEX idx_analytics_user ON analytics_events (user_id, created_at DESC);

-- Share card events: generated, shared, opened_from_link
-- Properties: { shop_id, cut_id, unit_id, price, avg_price, saved, city }

-- RPC: log an analytics event
CREATE OR REPLACE FUNCTION log_event(
  p_event TEXT,
  p_properties JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_events (user_id, event, properties)
  VALUES (auth.uid(), p_event, p_properties);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Price analytics materialized views
-- =============================================

-- Average price by cut across all active shops (for share card + trending)
CREATE MATERIALIZED VIEW price_averages AS
SELECT
  cp.cut_id,
  mc.name_en AS cut_name_en,
  mc.name_es AS cut_name_es,
  mc.animal,
  cp.unit_id,
  pu.abbreviation AS unit,
  COUNT(DISTINCT cp.shop_id) AS shop_count,
  ROUND(AVG(cp.price)::numeric, 2) AS avg_price,
  ROUND(MIN(cp.price)::numeric, 2) AS min_price,
  ROUND(MAX(cp.price)::numeric, 2) AS max_price,
  ROUND(STDDEV(cp.price)::numeric, 2) AS price_stddev
FROM current_prices cp
JOIN meat_cuts mc ON mc.id = cp.cut_id
JOIN price_unit pu ON pu.id = cp.unit_id
GROUP BY cp.cut_id, mc.name_en, mc.name_es, mc.animal, cp.unit_id, pu.abbreviation;

CREATE UNIQUE INDEX idx_price_avg_cut_unit ON price_averages (cut_id, unit_id);

-- Price averages by city (for geo-specific comparisons)
CREATE MATERIALIZED VIEW price_averages_by_city AS
SELECT
  cp.cut_id,
  mc.name_en AS cut_name_en,
  mc.name_es AS cut_name_es,
  cp.unit_id,
  pu.abbreviation AS unit,
  s.city,
  COUNT(DISTINCT cp.shop_id) AS shop_count,
  ROUND(AVG(cp.price)::numeric, 2) AS avg_price,
  ROUND(MIN(cp.price)::numeric, 2) AS min_price,
  ROUND(MAX(cp.price)::numeric, 2) AS max_price
FROM current_prices cp
JOIN shops s ON s.id = cp.shop_id
JOIN meat_cuts mc ON mc.id = cp.cut_id
JOIN price_unit pu ON pu.id = cp.unit_id
WHERE s.active = TRUE
GROUP BY cp.cut_id, mc.name_en, mc.name_es, cp.unit_id, pu.abbreviation, s.city;

CREATE UNIQUE INDEX idx_price_avg_city ON price_averages_by_city (cut_id, unit_id, city);

-- 7-day price trend per shop+cut (for trend arrows)
CREATE MATERIALIZED VIEW price_trends AS
SELECT
  p.shop_id,
  p.cut_id,
  p.unit_id,
  -- Current price (most recent)
  (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[1] AS current_price,
  -- Previous price (second most recent)
  (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[2] AS previous_price,
  -- 7-day price change
  CASE
    WHEN COUNT(*) >= 2 THEN
      (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[1] -
      (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[2]
    ELSE NULL
  END AS price_change,
  -- Direction
  CASE
    WHEN COUNT(*) < 2 THEN 'stable'
    WHEN (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[1] <
         (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[2] THEN 'down'
    WHEN (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[1] >
         (ARRAY_AGG(p.price ORDER BY p.recorded_at DESC))[2] THEN 'up'
    ELSE 'stable'
  END AS trend
FROM prices p
WHERE p.is_outlier = FALSE
  AND p.recorded_at >= now() - INTERVAL '7 days'
GROUP BY p.shop_id, p.cut_id, p.unit_id;

CREATE UNIQUE INDEX idx_price_trends ON price_trends (shop_id, cut_id, unit_id);

-- Refresh analytics views hourly (alongside shop_freshness)
SELECT cron.schedule(
  'refresh-price-averages',
  '10 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY price_averages'
);

SELECT cron.schedule(
  'refresh-price-averages-city',
  '15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY price_averages_by_city'
);

SELECT cron.schedule(
  'refresh-price-trends',
  '20 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY price_trends'
);

-- =============================================
-- Share card analytics aggregation
-- =============================================

-- RPC: get share card stats for a shop (butcher weekly report)
CREATE OR REPLACE FUNCTION get_shop_share_stats(
  p_shop_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSON AS $$
SELECT json_build_object(
  'cards_generated', COUNT(*) FILTER (WHERE event = 'share_card_generated'),
  'cards_shared', COUNT(*) FILTER (WHERE event = 'share_card_shared'),
  'link_opens', COUNT(*) FILTER (WHERE event = 'share_card_opened'),
  'top_cuts', (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT
        properties->>'cut_name_en' AS cut,
        COUNT(*) AS shares
      FROM analytics_events
      WHERE event = 'share_card_generated'
        AND properties->>'shop_id' = p_shop_id::text
        AND created_at >= now() - (p_days || ' days')::interval
      GROUP BY properties->>'cut_name_en'
      ORDER BY shares DESC
      LIMIT 5
    ) t
  )
)
FROM analytics_events
WHERE properties->>'shop_id' = p_shop_id::text
  AND created_at >= now() - (p_days || ' days')::interval;
$$ LANGUAGE sql STABLE;
