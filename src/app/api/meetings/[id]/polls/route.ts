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
  const { proposedDates } = await req.json();

  if (!proposedDates || !Array.isArray(proposedDates) || proposedDates.length === 0) {
    return NextResponse.json({ error: "Proposed dates required" }, { status: 400 });
  }

  const poll = await prisma.availabilityPoll.create({
    data: {
      meetingId: id,
      proposedDates: JSON.stringify(proposedDates),
    },
    include: { responses: true },
  });

  return NextResponse.json(poll);
}
