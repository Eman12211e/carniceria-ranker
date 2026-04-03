-- Consistency score: Median + MAD over 30-day window
-- This function calculates the consistency score for a shop's cut pricing
-- Uses Median Absolute Deviation to detect bait pricing

CREATE OR REPLACE FUNCTION calculate_consistency_score(
  p_shop_id UUID,
  p_cut_id UUID,
  p_unit_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_median NUMERIC;
  v_mad NUMERIC;
  v_score NUMERIC;
  v_count INT;
BEGIN
  -- Get prices from last 30 days (excluding already-flagged outliers)
  SELECT COUNT(*) INTO v_count
  FROM prices
  WHERE shop_id = p_shop_id
    AND cut_id = p_cut_id
    AND unit_id = p_unit_id
    AND is_outlier = FALSE
    AND recorded_at >= now() - INTERVAL '30 days';

  -- Need at least 3 data points for meaningful score
  IF v_count < 3 THEN
    RETURN NULL;
  END IF;

  -- Calculate median price
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY price)
  INTO v_median
  FROM prices
  WHERE shop_id = p_shop_id
    AND cut_id = p_cut_id
    AND unit_id = p_unit_id
    AND is_outlier = FALSE
    AND recorded_at >= now() - INTERVAL '30 days';

  -- Calculate MAD (Median Absolute Deviation)
  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ABS(price - v_median))
  INTO v_mad
  FROM prices
  WHERE shop_id = p_shop_id
    AND cut_id = p_cut_id
    AND unit_id = p_unit_id
    AND is_outlier = FALSE
    AND recorded_at >= now() - INTERVAL '30 days';

  -- Score: inverse of normalized MAD (lower deviation = higher score)
  -- Scale to 0-5 range for consistency with quality ratings
  IF v_mad = 0 THEN
    RETURN 5.0; -- Perfect consistency
  END IF;

  v_score := GREATEST(0, 5.0 - (v_mad / v_median * 10));
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Flag outliers: prices deviating > 3x MAD from median
CREATE OR REPLACE FUNCTION flag_price_outliers()
RETURNS void AS $$
DECLARE
  r RECORD;
  v_median NUMERIC;
  v_mad NUMERIC;
BEGIN
  -- For each active shop+cut+unit combo with recent prices
  FOR r IN
    SELECT DISTINCT shop_id, cut_id, unit_id
    FROM prices
    WHERE recorded_at >= now() - INTERVAL '30 days'
      AND is_outlier = FALSE
  LOOP
    -- Calculate median
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY price)
    INTO v_median
    FROM prices
    WHERE shop_id = r.shop_id AND cut_id = r.cut_id AND unit_id = r.unit_id
      AND is_outlier = FALSE
      AND recorded_at >= now() - INTERVAL '30 days';

    -- Calculate MAD
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ABS(price - v_median))
    INTO v_mad
    FROM prices
    WHERE shop_id = r.shop_id AND cut_id = r.cut_id AND unit_id = r.unit_id
      AND is_outlier = FALSE
      AND recorded_at >= now() - INTERVAL '30 days';

    -- Flag prices deviating > 3x MAD (skip if MAD is 0)
    IF v_mad > 0 THEN
      UPDATE prices
      SET is_outlier = TRUE, updated_at = now()
      WHERE shop_id = r.shop_id AND cut_id = r.cut_id AND unit_id = r.unit_id
        AND recorded_at >= now() - INTERVAL '30 days'
        AND ABS(price - v_median) > 3 * v_mad
        AND is_outlier = FALSE;
    END IF;
  END LOOP;

  -- Hard delete outliers older than 30 days
  DELETE FROM prices
  WHERE is_outlier = TRUE
    AND recorded_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
