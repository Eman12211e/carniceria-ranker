-- Shops (carnicerías, bodegas, grocery stores)
CREATE TABLE shops (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'CA',
  zip         TEXT,
  phone       TEXT,
  location    GEOGRAPHY(Point, 4326) NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  claimed     BOOLEAN NOT NULL DEFAULT FALSE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate shops at same location
  UNIQUE (name, location)
);

-- Geo-search index: find shops within 5 miles
CREATE INDEX idx_shops_location ON shops USING GIST (location);
CREATE INDEX idx_shops_city ON shops (city);
CREATE INDEX idx_shops_active ON shops (active) WHERE active = TRUE;
