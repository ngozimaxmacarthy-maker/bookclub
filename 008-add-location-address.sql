-- Fix: meetings API inserts location_address but the column was never created
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS location_address TEXT;
