-- Seed host rotation with 13 members in alphabetical order
INSERT INTO host_rotations (member_name, sort_order) VALUES
  ('Adaeze',   1),
  ('Akinyi',   2),
  ('Alexis',   3),
  ('Anisa',    4),
  ('Dani',     5),
  ('Fatima',   6),
  ('June',     7),
  ('Madison',  8),
  ('Nicole',   9),
  ('Nina',    10),
  ('Rebecca', 11),
  ('Simin',   12),
  ('Taylor',  13)
ON CONFLICT (member_name) DO NOTHING;
