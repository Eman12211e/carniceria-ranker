-- 00029_review_responses.sql
-- Allow shop owners to respond to reviews (one response per review)

CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id),
  response TEXT NOT NULL CHECK (length(response) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id)
);

-- Index for fast lookup by review
CREATE INDEX idx_review_responses_review_id ON review_responses (review_id);

-- Enable RLS
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read responses
CREATE POLICY review_responses_select ON review_responses
  FOR SELECT
  USING (true);

-- Insert: user must be the owner of the shop that the review is about
CREATE POLICY review_responses_insert ON review_responses
  FOR INSERT
  WITH CHECK (
    responder_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM reviews r
        JOIN shops s ON s.id = r.shop_id
       WHERE r.id = review_id
         AND s.owner_id = auth.uid()
    )
  );

-- Update: only the responder can update their own response
CREATE POLICY review_responses_update ON review_responses
  FOR UPDATE
  USING (responder_id = auth.uid())
  WITH CHECK (responder_id = auth.uid());

-- Delete: only the responder can delete their own response
CREATE POLICY review_responses_delete ON review_responses
  FOR DELETE
  USING (responder_id = auth.uid());

-- Convenience RPC for shop owners to respond to a review
CREATE OR REPLACE FUNCTION respond_to_review(p_review_id UUID, p_response TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_response_id UUID;
BEGIN
  -- Verify caller owns the shop being reviewed
  IF NOT EXISTS (
    SELECT 1
      FROM reviews r
      JOIN shops s ON s.id = r.shop_id
     WHERE r.id = p_review_id
       AND s.owner_id = v_caller
  ) THEN
    RAISE EXCEPTION 'Only the shop owner can respond to this review';
  END IF;

  INSERT INTO review_responses (review_id, responder_id, response)
  VALUES (p_review_id, v_caller, p_response)
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$;
