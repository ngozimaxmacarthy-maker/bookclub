import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const books = await prisma.book.findMany({
    where: status ? { status: status as "UPCOMING" | "CURRENT" | "COMPLETED" } : undefined,
    include: {
      ratings: true,
      _count: { select: { discussionQuestions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const book = await prisma.book.create({
    data: {
      title: body.title,
      author: body.author,
      genre: body.genre ?? null,
      coverUrl: body.coverUrl ?? null,
      description: body.description ?? null,
      status: body.status ?? "UPCOMING",
      libbySUrl: body.libbySUrl ?? null,
      kindleUrl: body.kindleUrl ?? null,
      amazonUrl: body.amazonUrl ?? null,
      bookshopUrl: body.bookshopUrl ?? null,
      reviewLinks: body.reviewLinks ? JSON.stringify(body.reviewLinks) : null,
    },
  });

  return NextResponse.json(book);
}
