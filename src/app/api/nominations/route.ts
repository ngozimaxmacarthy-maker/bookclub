import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface NominationRow {
  id: string;
  title: string;
  author: string;
  description: string;
  nominated_by: string;
  genre: string;
  cover_url: string | null;
  voting_opens_at: string;
  voting_closes_at: string;
}

interface VoteRow {
  voter_name: string;
  rankings: Array<{ nomination_id: string; rank: number }>;
}

export async function GET(req: NextRequest) {
  const sql = getDb();
  const month = req.nextUrl.searchParams.get("month");

  const roundsRaw = await sql`
    SELECT DISTINCT round_month FROM book_nominations
    WHERE round_month IS NOT NULL
    ORDER BY round_month DESC
  `;
  const rounds = roundsRaw as unknown as { round_month: string }[];

  const targetMonth = month || rounds[0]?.round_month || null;

  if (!targetMonth) {
    return NextResponse.json({ rounds: [], nominations: [], currentRound: null, myVote: null });
  }

  const nominationsRaw = await sql`
    SELECT bn.* FROM book_nominations bn
    WHERE bn.round_month = ${targetMonth}
    ORDER BY bn.created_at ASC
  `;
  const nominations = nominationsRaw as unknown as NominationRow[];

  const votesRaw = await sql`
    SELECT * FROM book_votes WHERE round_month = ${targetMonth}
  `;
  const votes = votesRaw as unknown as VoteRow[];

  const session = await getSession();
  const myVote = session.isLoggedIn
    ? votes.find((v) => v.voter_name === session.memberName) || null
    : null;

  // Borda scores: rank 1 gets N pts, rank 2 gets N-1, etc.
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

  const roundInfo = nominations[0];

  return NextResponse.json({
    rounds: rounds.map((r) => r.round_month),
    currentRound: targetMonth,
    votingOpens: roundInfo?.voting_opens_at,
    votingCloses: roundInfo?.voting_closes_at,
    totalVoters: votes.length,
    nominations: nominations
      .map((nom) => ({ ...nom, score: scores[nom.id] || 0 }))
      .sort((a, b) => b.score - a.score),
    myVote: myVote ? myVote.rankings : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, author, description, cover_url, roundMonth } = await req.json();
  if (!title || !author) {
    return NextResponse.json({ error: "Title and author required" }, { status: 400 });
  }

  const month = roundMonth || new Date().toISOString().slice(0, 7);
  const votingOpens = new Date();
  const votingCloses = new Date(votingOpens.getTime() + 14 * 24 * 60 * 60 * 1000);

  const sql = getDb();
  const rows = await sql`
    INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at, cover_url)
    VALUES (${title}, ${author}, ${description || null}, ${session.memberName}, ${month}, ${votingOpens.toISOString()}, ${votingCloses.toISOString()}, ${cover_url || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
