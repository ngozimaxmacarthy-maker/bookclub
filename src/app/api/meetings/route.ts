import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    include: {
      book: true,
      availabilityPolls: {
        include: { responses: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const meeting = await prisma.meeting.create({
    data: {
      bookId: body.bookId,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      location: body.location ?? null,
      locationNotes: body.locationNotes ?? null,
      locationAccessibility: body.locationAccessibility ?? null,
      hostName: body.hostName ?? null,
    },
    include: { book: true },
  });

  return NextResponse.json(meeting);
}
