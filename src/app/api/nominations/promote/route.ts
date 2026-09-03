import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface NominationRow {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  cover_url: string | null;
}

interface VoteRow {
  rankings: Array<{ nomination_id: string; rank: number }>;
}

// POST body: { roundMonth: string }
// Promotes the round's Borda winner into books as CURRENT.
// The previous CURRENT book (if any) is marked COMPLETED.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { roundMonth } = await req.json();
  if (!roundMonth) {
    return NextResponse.json({ error: "roundMonth required" }, { status: 400 });
  }

  const sql = getDb();

  const nominationsRaw = await sql`
    SELECT id, title, author, genre, description, cover_url
    FROM book_nominations WHERE round_month = ${roundMonth}
    ORDER BY created_at ASC
  `;
  const nominations = nominationsRaw as unknown as NominationRow[];
  if (!nominations.length) {
    return NextResponse.json({ error: "No nominations in this round" }, { status: 404 });
  }

  const votesRaw = await sql`
    SELECT rankings FROM book_votes WHERE round_month = ${roundMonth}
  `;
  const votes = votesRaw as unknown as VoteRow[];

  // Same Borda scoring as the nominations GET: rank 1 → N pts, rank N → 1 pt
  const n = nominations.length;
  const scores: Record<string, number> = {};
  nominations.forEach((nom) => { scores[nom.id] = 0; });
  votes.forEach((vote) => {
    const rankings = Array.isArray(vote.rankings) ? vote.rankings : [];
    rankings.forEach((r) => {
      if (scores[r.nomination_id] !== undefined) {
        scores[r.nomination_id] += (n - r.rank + 1);
      }
    });
  });

  const winner = [...nominations].sort((a, b) => scores[b.id] - scores[a.id])[0];

  // Don't double-promote: if a book with this title+author already exists, just return it
  const existing = await sql`
    SELECT id FROM books
    WHERE LOWER(title) = LOWER(${winner.title}) AND LOWER(author) = LOWER(${winner.author})
    LIMIT 1
  `;
  if (existing.length) {
    return NextResponse.json({ error: "This book is already in the library", bookId: existing[0].id }, { status: 409 });
  }

  // Finish the previous current read
  await sql`
    UPDATE books SET status = 'COMPLETED', completed_at = now() WHERE status = 'CURRENT'
  `;

  const rows = await sql`
    INSERT INTO books (title, author, genre, description, cover_url, status)
    VALUES (${winner.title}, ${winner.author}, ${winner.genre}, ${winner.description}, ${winner.cover_url}, 'CURRENT')
    RETURNING id, title, author, LOWER(status) AS status
  `;

  return NextResponse.json({ book: rows[0], score: scores[winner.id] }, { status: 201 });
}
