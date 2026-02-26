import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { available } = await req.json();
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "available must be boolean" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO availability_responses (poll_id, member_name, available)
    VALUES (${id}, ${session.memberName}, ${available})
    ON CONFLICT (poll_id, member_name)
    DO UPDATE SET available = ${available}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
