import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const sql = getDb();
  const meetings = await sql`
    SELECT m.*, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
    FROM meetings m
    LEFT JOIN books b ON b.id = m.book_id
    ORDER BY m.scheduled_date DESC
  `;
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { bookId, scheduledDate, location, locationAddress, locationNotes, locationAccessibility, hostName } = body;

  if (!bookId || !scheduledDate) {
    return NextResponse.json({ error: "Book and date required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO meetings (book_id, scheduled_date, location, location_address, location_notes, location_accessibility, host_name)
    VALUES (${bookId}, ${scheduledDate}, ${location || null}, ${locationAddress || null}, ${locationNotes || null}, ${locationAccessibility || null}, ${hostName || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
