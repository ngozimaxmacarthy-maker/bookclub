import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sql = getDb();
  const month = req.nextUrl.searchParams.get("month");

  // Get all distinct rounds
  const rounds = await sql`
    SELECT DISTINCT round_month FROM book_nominations
    WHERE round_month IS NOT NULL
    ORDER BY round_month DESC
  `;

  const targetMonth = month || rounds[0]?.round_month || null;

  if (!targetMonth) {
    return NextResponse.json({ rounds: [], nominations: [], currentRound: null, myVote: null });
  }

  const nominations = await sql`
    SELECT bn.* FROM book_nominations bn
    WHERE bn.round_month = ${targetMonth}
    ORDER BY bn.created_at ASC
  `;

  // Get all ranked choice votes for this round
  const votes = await sql`
    SELECT * FROM book_votes WHERE round_month = ${targetMonth}
  `;

  // Get the current user's vote
  const session = await getSession();
  const myVote = session.isLoggedIn
    ? votes.find((v: { voter_name: string }) => v.voter_name === session.memberName) || null
    : null;

  // Calculate Borda scores: for N nominations, rank 1 gets N points, rank 2 gets N-1, etc.
  const n = nominations.length;
  const scores: Record<string, number> = {};
  nominations.forEach((nom: { id: string }) => { scores[nom.id] = 0; });

  votes.forEach((vote: { rankings: Array<{ nomination_id: string; rank: number }> }) => {
    const rankings = Array.isArray(vote.rankings) ? vote.rankings : [];
    rankings.forEach((r) => {
      if (scores[r.nomination_id] !== undefined) {
        scores[r.nomination_id] += (n - r.rank + 1);
      }
    });
  });

  // Get round metadata (voting window)
  const roundInfo = nominations[0] || {};

  return NextResponse.json({
    rounds: rounds.map((r: { round_month: string }) => r.round_month),
    currentRound: targetMonth,
    votingOpens: roundInfo.voting_opens_at,
    votingCloses: roundInfo.voting_closes_at,
    totalVoters: votes.length,
    nominations: nominations.map((nom: { id: string; title: string; author: string; description: string; nominated_by: string; genre: string }) => ({
      ...nom,
      score: scores[nom.id] || 0,
    })).sort((a: { score: number }, b: { score: number }) => b.score - a.score),
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

  // Default to current month if no round specified
  const month = roundMonth || new Date().toISOString().slice(0, 7);
  const votingOpens = new Date();
  const votingCloses = new Date(votingOpens.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks

  const sql = getDb();
  const rows = await sql`
    INSERT INTO book_nominations (title, author, description, nominated_by, round_month, voting_opens_at, voting_closes_at, cover_url)
    VALUES (${title}, ${author}, ${description || null}, ${session.memberName}, ${month}, ${votingOpens.toISOString()}, ${votingCloses.toISOString()}, ${cover_url || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
