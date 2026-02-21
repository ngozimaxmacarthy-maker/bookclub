import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const questions = await prisma.discussionQuestion.findMany({
    where: { bookId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { question } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const q = await prisma.discussionQuestion.create({
    data: { bookId: id, question: question.trim(), submittedBy: member },
  });

  return NextResponse.json(q);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: bookId } = await params;
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });

  const q = await prisma.discussionQuestion.findUnique({ where: { id: questionId } });
  if (!q || q.submittedBy !== member) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.discussionQuestion.delete({ where: { id: questionId } });
  return NextResponse.json({ ok: true });
}
