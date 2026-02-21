import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      book: true,
      availabilityPolls: {
        include: { responses: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meeting);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      location: body.location ?? null,
      locationNotes: body.locationNotes ?? null,
      locationAccessibility: body.locationAccessibility ?? null,
      hostName: body.hostName ?? null,
      status: body.status ?? undefined,
    },
    include: { book: true },
  });

  return NextResponse.json(meeting);
}
