-- Reviews — quality pillar of the scoring system
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cut_id      UUID REFERENCES meat_cuts(id) ON DELETE SET NULL, -- optional: review a specific cut
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per user per shop per cut (NULL cut = general shop review)
  UNIQUE (user_id, shop_id, cut_id)
);

CREATE INDEX idx_reviews_shop ON reviews (shop_id);
CREATE INDEX idx_reviews_user ON reviews (user_id);
CREATE INDEX idx_reviews_rating ON reviews (shop_id, rating);
