-- Price flags — users report inaccurate prices
CREATE TABLE price_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_id    UUID NOT NULL REFERENCES prices(id) ON DELETE CASCADE,
  flagged_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One flag per user per price
  UNIQUE (price_id, flagged_by)
);

CREATE INDEX idx_flags_unresolved ON price_flags (resolved) WHERE resolved = FALSE;
