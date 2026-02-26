import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { proposedDate, label } = await req.json();
  if (!proposedDate) {
    return NextResponse.json({ error: "Proposed date required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO availability_polls (meeting_id, proposed_date, label)
    VALUES (${id}, ${proposedDate}, ${label || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
