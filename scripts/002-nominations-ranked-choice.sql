-- Add monthly round support and ranked choice voting to nominations

-- Add round columns to book_nominations
ALTER TABLE book_nominations ADD COLUMN IF NOT EXISTS round_month TEXT; -- e.g. '2025-12'
ALTER TABLE book_nominations ADD COLUMN IF NOT EXISTS voting_opens_at TIMESTAMPTZ;
ALTER TABLE book_nominations ADD COLUMN IF NOT EXISTS voting_closes_at TIMESTAMPTZ;

-- Replace book_votes with ranked choice votes
DROP TABLE IF EXISTS book_votes;
CREATE TABLE book_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_month TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  rankings JSONB NOT NULL DEFAULT '[]', -- [{nomination_id, rank}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_month, voter_name)
);

CREATE INDEX IF NOT EXISTS idx_book_votes_round ON book_votes(round_month);
