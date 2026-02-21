import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();

  // Toggle vote
  const existing = await sql`
    SELECT id FROM book_votes WHERE nomination_id = ${id} AND member_name = ${session.memberName}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM book_votes WHERE nomination_id = ${id} AND member_name = ${session.memberName}`;
    return NextResponse.json({ voted: false });
  }

  await sql`
    INSERT INTO book_votes (nomination_id, member_name) VALUES (${id}, ${session.memberName})
  `;
  return NextResponse.json({ voted: true });
}
