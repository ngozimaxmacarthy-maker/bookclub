import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { score, review } = await req.json();
  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: "Score must be 1-5" }, { status: 400 });
  }

  const sql = getDb();

  // Upsert: one rating per member per book
  const rows = await sql`
    INSERT INTO ratings (book_id, member_name, score, review)
    VALUES (${id}, ${session.memberName}, ${score}, ${review || null})
    ON CONFLICT (book_id, member_name)
    DO UPDATE SET score = ${score}, review = ${review || null}, created_at = NOW()
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
