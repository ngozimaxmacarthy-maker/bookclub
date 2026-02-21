import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();

  const meetings = await sql`
    SELECT m.*, b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
    FROM meetings m
    LEFT JOIN books b ON b.id = m.book_id
    WHERE m.id = ${id}
  `;

  if (!meetings.length) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const polls = await sql`
    SELECT ap.*,
      COALESCE(json_agg(
        json_build_object('id', ar.id, 'member_name', ar.member_name, 'available', ar.available)
      ) FILTER (WHERE ar.id IS NOT NULL), '[]') AS responses
    FROM availability_polls ap
    LEFT JOIN availability_responses ar ON ar.poll_id = ap.id
    WHERE ap.meeting_id = ${id}
    GROUP BY ap.id
    ORDER BY ap.proposed_date ASC
  `;

  const questions = await sql`
    SELECT * FROM discussion_questions WHERE book_id = ${meetings[0].book_id} ORDER BY created_at ASC
  `;

  return NextResponse.json({ ...meetings[0], polls, questions });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { scheduledDate, location, locationAddress, locationNotes, locationAccessibility, hostName } = body;
  const sql = getDb();

  const rows = await sql`
    UPDATE meetings SET
      scheduled_date = COALESCE(${scheduledDate || null}, scheduled_date),
      location = COALESCE(${location || null}, location),
      location_address = COALESCE(${locationAddress || null}, location_address),
      location_notes = COALESCE(${locationNotes || null}, location_notes),
      location_accessibility = COALESCE(${locationAccessibility || null}, location_accessibility),
      host_name = COALESCE(${hostName || null}, host_name)
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getDb();
  await sql`DELETE FROM meetings WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
