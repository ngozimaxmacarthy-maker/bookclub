import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET() {
  const nominations = await prisma.bookNomination.findMany({
    include: {
      votes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(nominations);
}

export async function POST(req: NextRequest) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, author, genre, description } = await req.json();

  if (!title?.trim() || !author?.trim()) {
    return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
  }

  const nomination = await prisma.bookNomination.create({
    data: {
      title: title.trim(),
      author: author.trim(),
      genre: genre?.trim() ?? null,
      description: description?.trim() ?? null,
      nominatedBy: member,
    },
    include: { votes: true },
  });

  return NextResponse.json(nomination);
}
