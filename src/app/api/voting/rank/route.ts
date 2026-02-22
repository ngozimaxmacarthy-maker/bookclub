import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { round_month, rankings } = await req.json();
  if (!round_month || !Array.isArray(rankings) || rankings.length === 0) {
    return NextResponse.json({ error: "round_month and rankings required" }, { status: 400 });
  }

  const meta = await sql_getVotingWindow(round_month);
  if (meta && new Date() > new Date(meta.voting_closes_at + "T23:59:59Z")) {
    return NextResponse.json({ error: "Voting has closed for this round" }, { status: 400 });
  }
  if (meta && new Date() < new Date(meta.voting_opens_at + "T00:00:00Z")) {
    return NextResponse.json({ error: "Voting has not opened yet for this round" }, { status: 400 });
  }

  const sql = getDb();
  const existing = await sql`
    SELECT id FROM book_votes WHERE round_month = ${round_month} AND voter_name = ${session.memberName}
  `;

  if (existing.length > 0) {
    await sql`
      UPDATE book_votes SET rankings = ${JSON.stringify(rankings)}, created_at = NOW()
      WHERE round_month = ${round_month} AND voter_name = ${session.memberName}
    `;
  } else {
    await sql`
      INSERT INTO book_votes (round_month, voter_name, rankings)
      VALUES (${round_month}, ${session.memberName}, ${JSON.stringify(rankings)})
    `;
  }

  return NextResponse.json({ success: true });
}

async function sql_getVotingWindow(round_month: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT voting_opens_at, voting_closes_at FROM book_nominations
    WHERE round_month = ${round_month} LIMIT 1
  `;
  return rows[0] || null;
}
