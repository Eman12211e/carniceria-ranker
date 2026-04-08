-- Beta feedback table for user testing (Week 5)
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL, -- 'Bug', 'Missing shop', 'Wrong price', 'Feature request', 'Other'
  message     TEXT NOT NULL,
  language    TEXT DEFAULT 'es',
  resolved    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users create feedback"
  ON feedback FOR INSERT
  WITH CHECK (TRUE); -- Allow even unauthenticated (guest) feedback

CREATE POLICY "Users see own feedback"
  ON feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all feedback"
  ON feedback FOR ALL
  USING (is_admin());
