import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateICS, googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") || "ics";
  const sql = getDb();

  const meetings = await sql`
    SELECT m.*, b.title AS book_title
    FROM meetings m
    LEFT JOIN books b ON b.id = m.book_id
    WHERE m.id = ${id}
  `;

  if (!meetings.length) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const m = meetings[0];
  const event = {
    title: `Book Club: ${m.book_title || "Meeting"}`,
    description: `Book club meeting discussing "${m.book_title}"`,
    location: m.location || "",
    start: new Date(m.scheduled_date),
    durationHours: 2,
  };

  if (format === "google") {
    return NextResponse.json({ url: googleCalendarUrl(event) });
  }

  if (format === "outlook") {
    return NextResponse.json({ url: outlookCalendarUrl(event) });
  }

  // Default: ICS download
  const icsContent = generateICS(event);
  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="bookclub-meeting.ics"`,
    },
  });
}
