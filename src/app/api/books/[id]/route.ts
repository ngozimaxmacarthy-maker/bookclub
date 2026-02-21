import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      ratings: true,
      discussionQuestions: { orderBy: { createdAt: "asc" } },
      meetings: { orderBy: { scheduledDate: "asc" } },
    },
  });

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const book = await prisma.book.update({
    where: { id },
    data: {
      title: body.title,
      author: body.author,
      genre: body.genre ?? null,
      coverUrl: body.coverUrl ?? null,
      description: body.description ?? null,
      status: body.status,
      libbySUrl: body.libbySUrl ?? null,
      kindleUrl: body.kindleUrl ?? null,
      amazonUrl: body.amazonUrl ?? null,
      bookshopUrl: body.bookshopUrl ?? null,
      reviewLinks: body.reviewLinks ? JSON.stringify(body.reviewLinks) : null,
      completedAt: body.status === "COMPLETED" ? new Date() : null,
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
