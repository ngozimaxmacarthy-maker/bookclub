import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// POST body: { roundMonth: string, rankings: [{nomination_id, rank}] }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roundMonth, rankings } = await req.json();
  if (!roundMonth || !Array.isArray(rankings)) {
    return NextResponse.json({ error: "roundMonth and rankings array required" }, { status: 400 });
  }

  const sql = getDb();

  // Check voting window
  const round = await sql`
    SELECT voting_closes_at FROM book_nominations
    WHERE round_month = ${roundMonth}
    LIMIT 1
  `;

  if (round.length > 0 && round[0].voting_closes_at) {
    const closes = new Date(round[0].voting_closes_at);
    if (new Date() > closes) {
      return NextResponse.json({ error: "Voting is closed for this round" }, { status: 400 });
    }
  }

  // Upsert ranked choice vote
  const rows = await sql`
    INSERT INTO book_votes (round_month, voter_name, rankings, updated_at)
    VALUES (${roundMonth}, ${session.memberName}, ${JSON.stringify(rankings)}, now())
    ON CONFLICT (round_month, voter_name)
    DO UPDATE SET rankings = ${JSON.stringify(rankings)}, updated_at = now()
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
