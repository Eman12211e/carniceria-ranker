-- Freshness tracking: detect stale shops and rank accordingly
-- A shop is "stale" if its most recent price is > 7 days old

-- Materialized view for shop freshness (refreshed by cron)
CREATE MATERIALIZED VIEW shop_freshness AS
SELECT
  s.id AS shop_id,
  s.name,
  s.city,
  COUNT(DISTINCT p.cut_id) AS cut_count,
  MAX(p.recorded_at) AS last_price_update,
  EXTRACT(DAY FROM now() - MAX(p.recorded_at))::INT AS days_since_update,
  CASE
    WHEN MAX(p.recorded_at) IS NULL THEN 'no_data'
    WHEN MAX(p.recorded_at) >= now() - INTERVAL '3 days' THEN 'fresh'
    WHEN MAX(p.recorded_at) >= now() - INTERVAL '7 days' THEN 'aging'
    ELSE 'stale'
  END AS freshness_status,
  -- Average review rating
  COALESCE(AVG(r.rating), 0) AS avg_rating,
  COUNT(DISTINCT r.id) AS review_count
FROM shops s
LEFT JOIN prices p ON p.shop_id = s.id AND p.is_outlier = FALSE
LEFT JOIN reviews r ON r.shop_id = s.id
WHERE s.active = TRUE
GROUP BY s.id, s.name, s.city;

CREATE UNIQUE INDEX idx_shop_freshness_id ON shop_freshness (shop_id);

-- Updated nearby_shops RPC that includes freshness + scores
CREATE OR REPLACE FUNCTION nearby_shops_ranked(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INT DEFAULT 8047
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  verified BOOLEAN,
  distance_miles DOUBLE PRECISION,
  freshness_status TEXT,
  days_since_update INT,
  cut_count BIGINT,
  avg_rating NUMERIC,
  review_count BIGINT
) AS $$
  SELECT
    s.id, s.name, s.address, s.city, s.phone, s.verified,
    ROUND((ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1609.34)::numeric, 1)::double precision AS distance_miles,
    COALESCE(sf.freshness_status, 'no_data') AS freshness_status,
    COALESCE(sf.days_since_update, 999) AS days_since_update,
    COALESCE(sf.cut_count, 0) AS cut_count,
    COALESCE(sf.avg_rating, 0) AS avg_rating,
    COALESCE(sf.review_count, 0) AS review_count
  FROM shops s
  LEFT JOIN shop_freshness sf ON sf.shop_id = s.id
  WHERE s.active = TRUE
    AND ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY
    -- Fresh shops first, stale shops last
    CASE COALESCE(sf.freshness_status, 'no_data')
      WHEN 'fresh' THEN 0
      WHEN 'aging' THEN 1
      WHEN 'stale' THEN 2
      ELSE 3
    END,
    -- Then by distance
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) ASC;
$$ LANGUAGE sql STABLE;

-- Schedule cron jobs (pg_cron must be enabled)
-- 1. Flag outliers daily at 3am
SELECT cron.schedule(
  'flag-price-outliers',
  '0 3 * * *',
  'SELECT flag_price_outliers()'
);

-- 2. Refresh shop_freshness every hour
SELECT cron.schedule(
  'refresh-shop-freshness',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY shop_freshness'
);

-- 3. Hard delete old outliers daily at 4am
SELECT cron.schedule(
  'delete-old-outliers',
  '0 4 * * *',
  $$DELETE FROM prices WHERE is_outlier = TRUE AND recorded_at < now() - INTERVAL '30 days'$$
);
