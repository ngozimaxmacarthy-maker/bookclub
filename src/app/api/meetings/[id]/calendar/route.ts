import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateICSContent } from "@/lib/calendar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { book: true },
  });

  if (!meeting || !meeting.scheduledDate) {
    return NextResponse.json({ error: "Meeting or date not found" }, { status: 404 });
  }

  const ics = generateICSContent({
    title: `Book Club: ${meeting.book.title}`,
    description: `Book Club meeting to discuss "${meeting.book.title}" by ${meeting.book.author}`,
    location: meeting.location ?? undefined,
    start: new Date(meeting.scheduledDate),
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="bookclub-meeting.ics"`,
    },
  });
}
