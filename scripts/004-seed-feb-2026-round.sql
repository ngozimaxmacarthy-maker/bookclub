-- Create February 2026 nomination round (voting: Feb 15 - Feb 28)
-- This is an empty round so members can nominate books through the app
INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at)
VALUES
  ('Placeholder', 'TBD', 'This round is open for nominations — add your picks!', 'System', '2026-02', '2026-02-15T00:00:00Z', '2026-02-28T23:59:59Z')
ON CONFLICT DO NOTHING;

-- Delete the placeholder once real nominations are added
DELETE FROM book_nominations WHERE round_month = '2026-02' AND author = 'TBD';

-- Just create the round metadata by inserting a real example nomination
-- Members will add more through the app
INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at)
VALUES
  ('The Midnight Library', 'Matt Haig', 'A woman finds herself in a library between life and death, with books that let her live alternate versions of her life.', 'System', '2026-02', '2026-02-15T00:00:00Z', '2026-02-28T23:59:59Z')
ON CONFLICT DO NOTHING;
