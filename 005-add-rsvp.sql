-- Add RSVP table for meeting attendance
CREATE TABLE IF NOT EXISTS meeting_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(meeting_id, member_name)
);

CREATE INDEX IF NOT EXISTS idx_meeting_rsvps_meeting_id ON meeting_rsvps(meeting_id);
