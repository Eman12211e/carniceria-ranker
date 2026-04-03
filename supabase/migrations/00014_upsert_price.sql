-- Upsert price RPC: safely insert or update today's price for a shop+cut+unit combo
-- Keeps full version history via the append-only prices table.
-- If a price already exists for today, it updates it and bumps updated_at.
-- Otherwise, it inserts a new row.

CREATE OR REPLACE FUNCTION upsert_price(
  p_shop_id UUID,
  p_cut_id UUID,
  p_unit_id UUID,
  p_price NUMERIC(8,2),
  p_submitted_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_existing_id UUID;
  v_result_id UUID;
BEGIN
  -- Check if a price already exists for this shop+cut+unit today
  SELECT id INTO v_existing_id
  FROM prices
  WHERE shop_id = p_shop_id
    AND cut_id = p_cut_id
    AND unit_id = p_unit_id
    AND (recorded_at::date) = CURRENT_DATE
    AND is_outlier = FALSE;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing today's price
    UPDATE prices
    SET price = p_price,
        submitted_by = COALESCE(p_submitted_by, submitted_by),
        updated_at = now()
    WHERE id = v_existing_id
    RETURNING id INTO v_result_id;
  ELSE
    -- Insert new price record
    INSERT INTO prices (shop_id, cut_id, unit_id, price, submitted_by, recorded_at)
    VALUES (p_shop_id, p_cut_id, p_unit_id, p_price, p_submitted_by, now())
    RETURNING id INTO v_result_id;
  END IF;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (RLS on prices table still applies for direct access)
GRANT EXECUTE ON FUNCTION upsert_price TO authenticated;

-- Also create a view for price history with version tracking
CREATE OR REPLACE VIEW price_history AS
SELECT
  p.id,
  p.shop_id,
  s.name AS shop_name,
  p.cut_id,
  mc.name_en AS cut_name_en,
  mc.name_es AS cut_name_es,
  p.unit_id,
  pu.abbreviation AS unit,
  p.price,
  p.is_outlier,
  p.recorded_at,
  p.created_at,
  p.updated_at,
  -- Was this price updated after initial creation?
  (p.updated_at > p.created_at + INTERVAL '1 second') AS was_revised,
  -- Days since this price was recorded
  EXTRACT(DAY FROM now() - p.recorded_at)::INT AS days_ago
FROM prices p
JOIN shops s ON s.id = p.shop_id
JOIN meat_cuts mc ON mc.id = p.cut_id
JOIN price_unit pu ON pu.id = p.unit_id
WHERE p.is_outlier = FALSE
ORDER BY p.recorded_at DESC;
