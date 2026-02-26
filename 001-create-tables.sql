-- Book Club App - Neon Postgres Schema
-- Run this against your Neon database to create all tables

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  cover_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','CURRENT','COMPLETED')),
  libby_url TEXT,
  kindle_url TEXT,
  amazon_url TEXT,
  bookshop_url TEXT,
  review_links JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, member_name)
);

CREATE TABLE IF NOT EXISTS discussion_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  location TEXT,
  location_notes TEXT,
  location_accessibility TEXT,
  host_name TEXT,
  status TEXT DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','COMPLETED','CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  proposed_dates JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES availability_polls(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  available_dates JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, member_name)
);

CREATE TABLE IF NOT EXISTS book_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  description TEXT,
  nominated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID REFERENCES book_nominations(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(nomination_id, voter_name)
);

CREATE TABLE IF NOT EXISTS host_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL,
  opt_out BOOLEAN DEFAULT false,
  last_hosted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_book_id ON ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_discussion_questions_book_id ON discussion_questions(book_id);
CREATE INDEX IF NOT EXISTS idx_meetings_book_id ON meetings(book_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_availability_polls_meeting_id ON availability_polls(meeting_id);
CREATE INDEX IF NOT EXISTS idx_availability_responses_poll_id ON availability_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_book_votes_nomination_id ON book_votes(nomination_id);
CREATE INDEX IF NOT EXISTS idx_host_rotations_sort_order ON host_rotations(sort_order);
