-- Price listings — append-only with daily upsert
CREATE TABLE prices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cut_id      UUID NOT NULL REFERENCES meat_cuts(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES price_unit(id) ON DELETE RESTRICT,
  price       NUMERIC(8,2) NOT NULL CHECK (price > 0),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_outlier  BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One price per shop per cut per unit per day
  UNIQUE (shop_id, cut_id, unit_id, (recorded_at::date))
);

-- Indexes for common queries
CREATE INDEX idx_prices_shop ON prices (shop_id);
CREATE INDEX idx_prices_cut ON prices (cut_id);
CREATE INDEX idx_prices_recent ON prices (recorded_at DESC);
CREATE INDEX idx_prices_shop_cut ON prices (shop_id, cut_id, recorded_at DESC);

-- "Current price" view: latest price per shop per cut
CREATE VIEW current_prices AS
SELECT DISTINCT ON (shop_id, cut_id, unit_id)
  id, shop_id, cut_id, unit_id, price, recorded_at, is_outlier
FROM prices
WHERE is_outlier = FALSE
ORDER BY shop_id, cut_id, unit_id, recorded_at DESC;
