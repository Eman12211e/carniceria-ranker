-- RPC function for geo-search: find shops within radius
CREATE OR REPLACE FUNCTION nearby_shops(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INT DEFAULT 8047  -- 5 miles
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  verified BOOLEAN,
  distance_miles DOUBLE PRECISION
) AS $$
  SELECT
    s.id,
    s.name,
    s.address,
    s.city,
    s.phone,
    s.verified,
    ROUND((ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1609.34)::numeric, 1)::double precision AS distance_miles
  FROM shops s
  WHERE s.active = TRUE
    AND ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_miles ASC;
$$ LANGUAGE sql STABLE;
