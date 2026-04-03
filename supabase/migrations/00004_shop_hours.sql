-- Shop operating hours — one row per day of week per shop
CREATE TABLE shop_hours (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  open_time   TIME,       -- NULL = closed that day
  close_time  TIME,       -- NULL = closed that day
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (shop_id, day_of_week),

  -- If one is set, both must be set
  CHECK (
    (open_time IS NULL AND close_time IS NULL) OR
    (open_time IS NOT NULL AND close_time IS NOT NULL)
  )
);

CREATE INDEX idx_shop_hours_shop ON shop_hours (shop_id);
