-- Photos — user/butcher uploaded images with moderation queue
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  cut_id      UUID REFERENCES meat_cuts(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  moderation  moderation_status NOT NULL DEFAULT 'pending',
  moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_shop ON photos (shop_id);
CREATE INDEX idx_photos_moderation ON photos (moderation) WHERE moderation = 'pending';
