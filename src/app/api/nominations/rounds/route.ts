import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// PUT /api/nominations/rounds
// Admin only — update the voting window for a round
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { roundMonth, votingOpensAt, votingClosesAt } = await req.json();
  if (!roundMonth || !votingOpensAt || !votingClosesAt) {
    return NextResponse.json({ error: "roundMonth, votingOpensAt, and votingClosesAt required" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    UPDATE book_nominations
    SET voting_opens_at = ${votingOpensAt}, voting_closes_at = ${votingClosesAt}
    WHERE round_month = ${roundMonth}
  `;

  return NextResponse.json({ ok: true });
}
