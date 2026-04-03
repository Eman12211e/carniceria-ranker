-- Row Level Security policies for all tables

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user owns a shop
CREATE OR REPLACE FUNCTION owns_shop(p_shop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops
    WHERE id = p_shop_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==================
-- PROFILES
-- ==================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ==================
-- SHOPS
-- ==================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active shops"
  ON shops FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Admins read all shops"
  ON shops FOR SELECT
  USING (is_admin());

CREATE POLICY "Butchers update own shop"
  ON shops FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Admins manage all shops"
  ON shops FOR ALL
  USING (is_admin());

-- ==================
-- SHOP HOURS
-- ==================
ALTER TABLE shop_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shop hours"
  ON shop_hours FOR SELECT
  USING (TRUE);

CREATE POLICY "Butchers manage own shop hours"
  ON shop_hours FOR ALL
  USING (owns_shop(shop_id));

CREATE POLICY "Admins manage all shop hours"
  ON shop_hours FOR ALL
  USING (is_admin());

-- ==================
-- MEAT CUTS
-- ==================
ALTER TABLE meat_cuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meat cuts"
  ON meat_cuts FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage meat cuts"
  ON meat_cuts FOR ALL
  USING (is_admin());

-- ==================
-- PRICE UNIT
-- ==================
ALTER TABLE price_unit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price units"
  ON price_unit FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage price units"
  ON price_unit FOR ALL
  USING (is_admin());

-- ==================
-- PRICES
-- ==================
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prices"
  ON prices FOR SELECT
  USING (TRUE);

CREATE POLICY "Butchers insert prices for own shop"
  ON prices FOR INSERT
  WITH CHECK (owns_shop(shop_id));

CREATE POLICY "Butchers update own shop prices"
  ON prices FOR UPDATE
  USING (owns_shop(shop_id));

CREATE POLICY "Admins manage all prices"
  ON prices FOR ALL
  USING (is_admin());

-- ==================
-- REVIEWS
-- ==================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reviews"
  ON reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own reviews"
  ON reviews FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all reviews"
  ON reviews FOR ALL
  USING (is_admin());

-- ==================
-- PHOTOS
-- ==================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved photos"
  ON photos FOR SELECT
  USING (moderation = 'approved');

CREATE POLICY "Users see own pending photos"
  ON photos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users upload photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own photos"
  ON photos FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all photos"
  ON photos FOR ALL
  USING (is_admin());

-- ==================
-- PRICE FLAGS
-- ==================
ALTER TABLE price_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users create flags"
  ON price_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Users see own flags"
  ON price_flags FOR SELECT
  USING (flagged_by = auth.uid());

CREATE POLICY "Admins manage all flags"
  ON price_flags FOR ALL
  USING (is_admin());
