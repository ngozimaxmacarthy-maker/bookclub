import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ratings = await prisma.rating.findMany({
    where: { bookId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(ratings);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, review } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const r = await prisma.rating.upsert({
    where: { bookId_memberName: { bookId: id, memberName: member } },
    update: { rating, review: review ?? null },
    create: { bookId: id, memberName: member, rating, review: review ?? null },
  });

  return NextResponse.json(r);
}
