-- Seed the 9 books from the club's history
INSERT INTO books (title, author, genre, status) VALUES
  ('Intermezzo', 'Sally Rooney', 'Literary Fiction', 'COMPLETED'),
  ('A Court of Thorns and Roses', 'Sarah J. Maas', 'Fantasy Romance', 'COMPLETED'),
  ('My Year of Rest and Relaxation', 'Ottessa Moshfegh', 'Literary Fiction', 'COMPLETED'),
  ('The Women', 'Kristin Hannah', 'Historical Fiction', 'COMPLETED'),
  ('Remarkably Bright Creatures', 'Shelby Van Pelt', 'Contemporary Fiction', 'COMPLETED'),
  ('Demon Copperhead', 'Barbara Kingsolver', 'Literary Fiction', 'COMPLETED'),
  ('Tomorrow and Tomorrow and Tomorrow', 'Gabrielle Zevin', 'Literary Fiction', 'COMPLETED'),
  ('The Housemaid', 'Freida McFadden', 'Thriller', 'COMPLETED'),
  ('Lessons in Chemistry', 'Bonnie Garmus', 'Historical Fiction', 'COMPLETED')
ON CONFLICT DO NOTHING;

-- Seed the December 2025 nomination round
-- Voting opens Dec 1 2025, closes Dec 14 2025 (2 weeks)
INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at) VALUES
  ('James', 'Percival Everett', 'A reimagining of Adventures of Huckleberry Finn told from the enslaved Jim''s point of view. Winner of the 2025 Pulitzer Prize for Fiction.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('The God of the Woods', 'Liz Moore', 'A sprawling mystery set in the Adirondacks, weaving together the disappearance of two children decades apart at a family-owned summer camp.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('Colored Television', 'Danzy Senna', 'A satirical novel about a biracial writer in LA who abandons her literary novel for a TV deal, exploring race, class, and ambition.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('All Fours', 'Miranda July', 'A woman on the cusp of menopause takes a cross-country road trip that veers wildly off course, exploring desire, aging, and reinvention.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('Sandwich', 'Catherine Newman', 'A family beach vacation told through the perspective of a middle-aged mother reflecting on the beautiful, bittersweet middle of life.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('The Ministry of Time', 'Kaliane Bradley', 'A genre-bending romance and sci-fi novel where a civil servant is paired with a 19th-century Arctic explorer brought to the present via time travel.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('Long Island', 'Colm Toibin', 'The sequel to Brooklyn, following Eilis Lacey decades later as a secret threatens to upend her carefully built life on Long Island.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('The Women', 'Kristin Hannah', 'The story of a young nurse who volunteers for Vietnam and returns home to a country that doesn''t want to acknowledge her service or sacrifice.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('Funny Story', 'Emily Henry', 'A rom-com about two exes'' new partners who become unlikely roommates and maybe something more, set in a charming Michigan beach town.', 'Club', '2025-12', '2025-12-01', '2025-12-14'),
  ('The Boyfriend', 'Freida McFadden', 'A thriller about a woman whose new boyfriend seems perfect - until she discovers disturbing connections to her missing friend.', 'Club', '2025-12', '2025-12-01', '2025-12-14')
ON CONFLICT DO NOTHING;
