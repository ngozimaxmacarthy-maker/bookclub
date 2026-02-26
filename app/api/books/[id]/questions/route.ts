import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { question } = await req.json();
  if (!question || !question.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO discussion_questions (book_id, question, submitted_by)
    VALUES (${id}, ${question.trim()}, ${session.memberName})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const questionId = req.nextUrl.searchParams.get("questionId");
  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM discussion_questions WHERE id = ${questionId} AND book_id = ${id}`;
  return NextResponse.json({ ok: true });
}
