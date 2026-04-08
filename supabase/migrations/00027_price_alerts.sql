-- Price alerts — Week 7
-- Users set alerts for a cut+price threshold.
-- When a new price is submitted below their threshold, they get notified.

CREATE TABLE price_alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cut_id      UUID NOT NULL REFERENCES meat_cuts(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES price_unit(id) ON DELETE RESTRICT,
  target_price NUMERIC(8,2) NOT NULL CHECK (target_price > 0),
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  radius_meters INT NOT NULL DEFAULT 8047, -- 5 miles
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ,  -- last time this alert fired
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One alert per user per cut per unit
  UNIQUE (user_id, cut_id, unit_id)
);

CREATE INDEX idx_alerts_active ON price_alerts (active, cut_id, unit_id) WHERE active = TRUE;

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts"
  ON price_alerts FOR ALL
  USING (user_id = auth.uid());

-- Notification queue (processed by edge function or push service)
CREATE TABLE notification_queue (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- 'price_alert', 'moderation_update', 'verification_update'
  title_en    TEXT NOT NULL,
  title_es    TEXT NOT NULL,
  body_en     TEXT NOT NULL,
  body_es     TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  sent        BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_unsent ON notification_queue (sent) WHERE sent = FALSE;

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System creates notifications"
  ON notification_queue FOR INSERT
  WITH CHECK (TRUE); -- Created by triggers, not users directly

-- RPC: create a price alert
CREATE OR REPLACE FUNCTION create_price_alert(
  p_cut_id UUID,
  p_unit_id UUID,
  p_target_price NUMERIC,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters INT DEFAULT 8047
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO price_alerts (user_id, cut_id, unit_id, target_price, latitude, longitude, radius_meters)
  VALUES (auth.uid(), p_cut_id, p_unit_id, p_target_price, p_latitude, p_longitude, p_radius_meters)
  ON CONFLICT (user_id, cut_id, unit_id)
  DO UPDATE SET
    target_price = EXCLUDED.target_price,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    radius_meters = EXCLUDED.radius_meters,
    active = TRUE,
    triggered_at = NULL
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get user's active alerts with current best price
CREATE OR REPLACE FUNCTION get_my_alerts()
RETURNS TABLE (
  alert_id UUID,
  cut_name_en TEXT,
  cut_name_es TEXT,
  animal meat_animal,
  unit TEXT,
  target_price NUMERIC,
  current_best_price NUMERIC,
  current_best_shop TEXT,
  is_triggered BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    pa.id AS alert_id,
    mc.name_en AS cut_name_en,
    mc.name_es AS cut_name_es,
    mc.animal,
    pu.abbreviation AS unit,
    pa.target_price,
    (
      SELECT MIN(cp.price)
      FROM current_prices cp
      JOIN shops s ON s.id = cp.shop_id
      WHERE cp.cut_id = pa.cut_id
        AND cp.unit_id = pa.unit_id
        AND s.active = TRUE
        AND ST_DWithin(
          s.location,
          ST_SetSRID(ST_MakePoint(pa.longitude, pa.latitude), 4326)::geography,
          pa.radius_meters
        )
    ) AS current_best_price,
    (
      SELECT s.name
      FROM current_prices cp
      JOIN shops s ON s.id = cp.shop_id
      WHERE cp.cut_id = pa.cut_id
        AND cp.unit_id = pa.unit_id
        AND s.active = TRUE
        AND ST_DWithin(
          s.location,
          ST_SetSRID(ST_MakePoint(pa.longitude, pa.latitude), 4326)::geography,
          pa.radius_meters
        )
      ORDER BY cp.price ASC
      LIMIT 1
    ) AS current_best_shop,
    (
      SELECT MIN(cp.price) <= pa.target_price
      FROM current_prices cp
      JOIN shops s ON s.id = cp.shop_id
      WHERE cp.cut_id = pa.cut_id
        AND cp.unit_id = pa.unit_id
        AND s.active = TRUE
        AND ST_DWithin(
          s.location,
          ST_SetSRID(ST_MakePoint(pa.longitude, pa.latitude), 4326)::geography,
          pa.radius_meters
        )
    ) AS is_triggered,
    pa.created_at
  FROM price_alerts pa
  JOIN meat_cuts mc ON mc.id = pa.cut_id
  JOIN price_unit pu ON pu.id = pa.unit_id
  WHERE pa.user_id = auth.uid()
    AND pa.active = TRUE
  ORDER BY pa.created_at DESC;
$$ LANGUAGE sql STABLE;

-- Trigger: when a price is inserted/updated, check if any alerts should fire
CREATE OR REPLACE FUNCTION check_price_alerts()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  v_shop_name TEXT;
  v_cut_name_en TEXT;
  v_cut_name_es TEXT;
  v_unit TEXT;
BEGIN
  -- Get shop info
  SELECT name INTO v_shop_name FROM shops WHERE id = NEW.shop_id;
  SELECT name_en, name_es INTO v_cut_name_en, v_cut_name_es FROM meat_cuts WHERE id = NEW.cut_id;
  SELECT abbreviation INTO v_unit FROM price_unit WHERE id = NEW.unit_id;

  -- Find all active alerts for this cut+unit where price meets threshold
  FOR r IN
    SELECT pa.*
    FROM price_alerts pa
    WHERE pa.cut_id = NEW.cut_id
      AND pa.unit_id = NEW.unit_id
      AND pa.active = TRUE
      AND NEW.price <= pa.target_price
      -- Only alert if shop is within user's radius
      AND ST_DWithin(
        (SELECT location FROM shops WHERE id = NEW.shop_id),
        ST_SetSRID(ST_MakePoint(pa.longitude, pa.latitude), 4326)::geography,
        pa.radius_meters
      )
      -- Don't re-trigger within 24h
      AND (pa.triggered_at IS NULL OR pa.triggered_at < now() - INTERVAL '24 hours')
  LOOP
    -- Queue notification
    INSERT INTO notification_queue (user_id, type, title_en, title_es, body_en, body_es, data)
    VALUES (
      r.user_id,
      'price_alert',
      'Price Alert: ' || v_cut_name_en,
      'Alerta de Precio: ' || v_cut_name_es,
      v_cut_name_en || ' at ' || v_shop_name || ' is now $' || NEW.price || '/' || v_unit || ' — below your target of $' || r.target_price || '/' || v_unit,
      v_cut_name_es || ' en ' || v_shop_name || ' ahora está a $' || NEW.price || '/' || v_unit || ' — debajo de tu meta de $' || r.target_price || '/' || v_unit,
      jsonb_build_object(
        'alert_id', r.id,
        'shop_id', NEW.shop_id,
        'shop_name', v_shop_name,
        'cut_id', NEW.cut_id,
        'price', NEW.price,
        'target_price', r.target_price,
        'unit', v_unit
      )
    );

    -- Mark alert as triggered
    UPDATE price_alerts SET triggered_at = now() WHERE id = r.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_price_check_alerts
  AFTER INSERT OR UPDATE OF price ON prices
  FOR EACH ROW
  WHEN (NEW.is_outlier = FALSE)
  EXECUTE FUNCTION check_price_alerts();
