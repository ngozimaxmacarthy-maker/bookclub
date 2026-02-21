import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const sql = getDb();
  const nominations = await sql`
    SELECT bn.*,
      COUNT(DISTINCT bv.id) AS vote_count,
      COALESCE(json_agg(bv.member_name) FILTER (WHERE bv.id IS NOT NULL), '[]') AS voters
    FROM book_nominations bn
    LEFT JOIN book_votes bv ON bv.nomination_id = bn.id
    WHERE bn.is_active = true
    GROUP BY bn.id
    ORDER BY vote_count DESC, bn.created_at ASC
  `;
  return NextResponse.json(nominations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title, author, reason } = await req.json();
  if (!title || !author) {
    return NextResponse.json({ error: "Title and author required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO book_nominations (title, author, reason, nominated_by)
    VALUES (${title}, ${author}, ${reason || null}, ${session.memberName})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
