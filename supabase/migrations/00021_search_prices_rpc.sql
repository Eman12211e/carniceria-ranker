-- RPC: search for a cut and get all nearby shops with prices, ranked
CREATE OR REPLACE FUNCTION search_cut_prices(
  p_cut_id UUID,
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_radius_meters INT DEFAULT 8047
)
RETURNS TABLE (
  shop_id UUID,
  shop_name TEXT,
  shop_address TEXT,
  shop_city TEXT,
  shop_verified BOOLEAN,
  distance_miles DOUBLE PRECISION,
  price NUMERIC,
  unit TEXT,
  unit_id UUID,
  price_id UUID,
  recorded_at TIMESTAMPTZ,
  freshness_status TEXT,
  avg_rating NUMERIC,
  review_count BIGINT
) AS $$
  SELECT
    s.id AS shop_id,
    s.name AS shop_name,
    s.address AS shop_address,
    s.city AS shop_city,
    s.verified AS shop_verified,
    ROUND((ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
    ) / 1609.34)::numeric, 1)::double precision AS distance_miles,
    cp.price,
    pu.abbreviation AS unit,
    cp.unit_id,
    cp.id AS price_id,
    cp.recorded_at,
    COALESCE(sf.freshness_status, 'no_data') AS freshness_status,
    COALESCE(sf.avg_rating, 0) AS avg_rating,
    COALESCE(sf.review_count, 0) AS review_count
  FROM current_prices cp
  JOIN shops s ON s.id = cp.shop_id
  JOIN price_unit pu ON pu.id = cp.unit_id
  LEFT JOIN shop_freshness sf ON sf.shop_id = s.id
  WHERE cp.cut_id = p_cut_id
    AND s.active = TRUE
    AND ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
      p_radius_meters
    )
  ORDER BY cp.price ASC, distance_miles ASC;
$$ LANGUAGE sql STABLE;
