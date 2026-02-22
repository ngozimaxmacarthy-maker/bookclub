-- Migration: add cover_url column
ALTER TABLE book_nominations ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Seed: 8 nominations for February 2026
INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at, cover_url)
VALUES
  (
    'Intermezzo',
    'Sally Rooney',
    'A deeply moving novel about two grieving brothers navigating love and loss in modern Ireland.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9780374610364-M.jpg'
  ),
  (
    'James',
    'Percival Everett',
    '2025 Pulitzer Prize winner — a retelling of Huckleberry Finn from the perspective of Jim.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9780385550369-M.jpg'
  ),
  (
    'The God of the Woods',
    'Liz Moore',
    'A sweeping mystery set at a Adirondacks summer camp where a girl goes missing in 1975.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9780593418666-M.jpg'
  ),
  (
    'The Women',
    'Kristin Hannah',
    'An unforgettable story of the women who served as Army nurses in Vietnam and came home to an indifferent America.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9781250178633-M.jpg'
  ),
  (
    'The Ministry of Time',
    'Kaliane Bradley',
    'A witty, romantic debut about a civil servant assigned to a time-traveling officer from 1847 — with world-ending stakes.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9781668022337-M.jpg'
  ),
  (
    'Orbital',
    'Samantha Harvey',
    '2024 Booker Prize winner — sixteen orbits of Earth, six astronauts, one transcendent day.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9780802163592-M.jpg'
  ),
  (
    'All Fours',
    'Miranda July',
    'A boundary-dissolving novel about a woman who stops mid-road trip and discovers a new life in a motel.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9781635979619-M.jpg'
  ),
  (
    'The Familiar',
    'Leigh Bardugo',
    'A lush historical fantasy set in 1491 Spain, following a young woman with mysterious power and a king''s desperate bargain.',
    'seed',
    '2026-02',
    '2026-02-01T00:00:00Z',
    '2026-02-28T23:59:59Z',
    'https://covers.openlibrary.org/b/isbn/9781250875372-M.jpg'
  )
ON CONFLICT DO NOTHING;
