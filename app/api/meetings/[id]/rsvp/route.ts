import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!["yes", "no", "maybe"].includes(status)) {
    return NextResponse.json({ error: "Status must be yes, no, or maybe" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO meeting_rsvps (meeting_id, member_name, status)
    VALUES (${id}, ${session.memberName}, ${status})
    ON CONFLICT (meeting_id, member_name)
    DO UPDATE SET status = EXCLUDED.status
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
