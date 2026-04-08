-- 00030_shop_name_dedup.sql
-- Fuzzy shop name deduplication to detect fake/duplicate shops

-- Ensure pg_trgm is available for similarity()
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Check for duplicate shops near a given location
CREATE OR REPLACE FUNCTION check_duplicate_shop(
  p_name TEXT,
  p_lat DOUBLE PRECISION,
  p_lon DOUBLE PRECISION
)
RETURNS TABLE (
  shop_id UUID,
  shop_name TEXT,
  distance_meters DOUBLE PRECISION,
  name_similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS shop_id,
    s.name AS shop_name,
    ST_Distance(
      s.location::geography,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
    ) AS distance_meters,
    similarity(lower(s.name), lower(p_name))::DOUBLE PRECISION AS name_similarity
  FROM shops s
  WHERE s.active = true
    AND ST_DWithin(
      s.location::geography,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
      100  -- within 100 meters
    )
    AND similarity(lower(s.name), lower(p_name)) > 0.3
  ORDER BY name_similarity DESC;
END;
$$;

-- Scan all shops for potential duplicates and log them
CREATE OR REPLACE FUNCTION flag_potential_duplicates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO abuse_log (event_type, severity, payload)
  SELECT
    'potential_duplicate',
    'medium',
    jsonb_build_object(
      'shop_a_id', a.id,
      'shop_a_name', a.name,
      'shop_b_id', b.id,
      'shop_b_name', b.name,
      'distance_meters', ST_Distance(a.location::geography, b.location::geography),
      'name_similarity', similarity(lower(a.name), lower(b.name))
    )
  FROM shops a
  JOIN shops b
    ON a.id < b.id  -- avoid duplicate pairs and self-joins
   AND a.active = true
   AND b.active = true
   AND ST_DWithin(a.location::geography, b.location::geography, 100)
   AND similarity(lower(a.name), lower(b.name)) > 0.4
  WHERE NOT EXISTS (
    -- Skip pairs already logged
    SELECT 1
      FROM abuse_log al
     WHERE al.event_type = 'potential_duplicate'
       AND al.payload->>'shop_a_id' = a.id::text
       AND al.payload->>'shop_b_id' = b.id::text
  );
END;
$$;

-- Schedule weekly duplicate scan on Sundays at 3 AM
SELECT cron.schedule('flag-shop-duplicates', '0 3 * * 0', $$SELECT flag_potential_duplicates()$$);
