import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.bookVote.findUnique({
    where: { nominationId_voterName: { nominationId: id, voterName: member } },
  });

  if (existing) {
    // Toggle: remove the vote
    await prisma.bookVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await prisma.bookVote.create({
    data: { nominationId: id, voterName: member },
  });

  return NextResponse.json({ voted: true });
}
