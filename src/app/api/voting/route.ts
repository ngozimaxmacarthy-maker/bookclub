import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const month = req.nextUrl.searchParams.get("month");

  const rounds = await sql`
    SELECT DISTINCT round_month FROM book_nominations
    WHERE round_month IS NOT NULL ORDER BY round_month DESC
  `;

  const targetMonth = month || rounds[0]?.round_month || null;
  if (!targetMonth) {
    return NextResponse.json({ rounds: [], nominations: [], votes: null, currentRound: null });
  }

  const nominations = await sql`
    SELECT * FROM book_nominations
    WHERE round_month = ${targetMonth}
    ORDER BY created_at ASC
  `;

  const session = await getSession();
  let myVotes = null;
  if (session.loggedIn && session.memberName) {
    const existing = await sql`
      SELECT rankings FROM book_votes
      WHERE round_month = ${targetMonth} AND voter_name = ${session.memberName}
    `;
    if (existing.length > 0) {
      myVotes = existing[0].rankings;
    }
  }

  const allVotes = await sql`
    SELECT voter_name, rankings FROM book_votes
    WHERE round_month = ${targetMonth}
  `;

  const nomMap: Record<string, { title: string; score: number; voters: number }> = {};
  for (const nom of nominations) {
    nomMap[nom.id] = { title: nom.title, score: 0, voters: 0 };
  }
  const totalNoms = nominations.length;
  for (const v of allVotes) {
    const rankings = v.rankings as { nomination_id: string; rank: number }[];
    for (const r of rankings) {
      if (nomMap[r.nomination_id]) {
        nomMap[r.nomination_id].score += (totalNoms + 1 - r.rank);
        nomMap[r.nomination_id].voters += 1;
      }
    }
  }

  const scoredNoms = nominations.map((n: Record<string, unknown>) => ({
    ...n,
    borda_score: nomMap[n.id as string]?.score || 0,
    voter_count: nomMap[n.id as string]?.voters || 0,
  }));
  scoredNoms.sort((a: { borda_score: number }, b: { borda_score: number }) => b.borda_score - a.borda_score);

  return NextResponse.json({
    rounds: rounds.map((r: Record<string, unknown>) => r.round_month),
    currentRound: targetMonth,
    nominations: scoredNoms,
    myVotes,
    totalVoters: allVotes.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, author, description, genre, round_month } = await req.json();
  if (!title || !author || !round_month) {
    return NextResponse.json({ error: "Title, author, and round month are required" }, { status: 400 });
  }

  const sql = getDb();
  const existing = await sql`SELECT id FROM book_nominations WHERE round_month = ${round_month} LIMIT 1`;
  let votingOpens: string, votingCloses: string;
  if (existing.length > 0) {
    const dates = await sql`
      SELECT voting_opens_at, voting_closes_at FROM book_nominations WHERE round_month = ${round_month} LIMIT 1
    `;
    votingOpens = dates[0].voting_opens_at;
    votingCloses = dates[0].voting_closes_at;
  } else {
    const [year, mon] = round_month.split("-");
    votingOpens = `${year}-${mon}-15`;
    votingCloses = `${year}-${mon}-27`;
  }

  const rows = await sql`
    INSERT INTO book_nominations (title, author, description, genre, nominated_by, round_month, voting_opens_at, voting_closes_at)
    VALUES (${title}, ${author}, ${description || null}, ${genre || null}, ${session.memberName}, ${round_month}, ${votingOpens}, ${votingCloses})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
