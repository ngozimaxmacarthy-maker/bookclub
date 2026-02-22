-- Fix Feb 2026 voting window to 15th-27th
UPDATE book_nominations
SET voting_opens_at = '2026-02-15T00:00:00Z',
    voting_closes_at = '2026-02-27T23:59:59Z'
WHERE round_month = '2026-02';

-- Also fix Dec 2025 to match the 15th-27th pattern
UPDATE book_nominations
SET voting_opens_at = '2025-12-15T00:00:00Z',
    voting_closes_at = '2025-12-27T23:59:59Z'
WHERE round_month = '2025-12';
