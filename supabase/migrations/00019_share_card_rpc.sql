-- RPC for share card data: price vs local average
CREATE OR REPLACE FUNCTION get_share_card_data(
  p_shop_id UUID,
  p_cut_id UUID,
  p_unit_id UUID,
  p_user_lat DOUBLE PRECISION DEFAULT NULL,
  p_user_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_shop_name TEXT;
  v_cut_name_en TEXT;
  v_cut_name_es TEXT;
  v_unit TEXT;
  v_price NUMERIC;
  v_avg_price NUMERIC;
BEGIN
  -- Get shop name
  SELECT name INTO v_shop_name FROM shops WHERE id = p_shop_id;

  -- Get cut names
  SELECT name_en, name_es INTO v_cut_name_en, v_cut_name_es
  FROM meat_cuts WHERE id = p_cut_id;

  -- Get unit
  SELECT abbreviation INTO v_unit FROM price_unit WHERE id = p_unit_id;

  -- Get current price for this shop+cut+unit
  SELECT price INTO v_price
  FROM current_prices
  WHERE shop_id = p_shop_id AND cut_id = p_cut_id AND unit_id = p_unit_id;

  -- Calculate local average (all shops within 5mi, or all shops if no location given)
  IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
    SELECT AVG(cp.price) INTO v_avg_price
    FROM current_prices cp
    JOIN shops s ON s.id = cp.shop_id
    WHERE cp.cut_id = p_cut_id
      AND cp.unit_id = p_unit_id
      AND s.active = TRUE
      AND ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
        8047
      );
  ELSE
    SELECT AVG(cp.price) INTO v_avg_price
    FROM current_prices cp
    WHERE cp.cut_id = p_cut_id AND cp.unit_id = p_unit_id;
  END IF;

  SELECT json_build_object(
    'shop_name', v_shop_name,
    'cut_name_en', v_cut_name_en,
    'cut_name_es', v_cut_name_es,
    'price', v_price,
    'unit', v_unit,
    'avg_price', ROUND(v_avg_price, 2),
    'saved', ROUND(GREATEST(0, v_avg_price - v_price), 2),
    'saved_percent', CASE
      WHEN v_avg_price > 0 THEN ROUND(((v_avg_price - v_price) / v_avg_price * 100)::numeric, 0)
      ELSE 0
    END,
    'date', CURRENT_DATE
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;
