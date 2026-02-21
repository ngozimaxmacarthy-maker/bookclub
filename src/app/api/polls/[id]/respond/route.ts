import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { availableDates } = await req.json();

  if (!Array.isArray(availableDates)) {
    return NextResponse.json({ error: "availableDates must be an array" }, { status: 400 });
  }

  const response = await prisma.availabilityResponse.upsert({
    where: { pollId_memberName: { pollId: id, memberName: member } },
    update: { availableDates: JSON.stringify(availableDates) },
    create: {
      pollId: id,
      memberName: member,
      availableDates: JSON.stringify(availableDates),
    },
  });

  return NextResponse.json(response);
}
