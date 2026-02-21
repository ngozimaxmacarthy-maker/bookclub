import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const sql = getDb();
  const hosts = await sql`
    SELECT * FROM host_rotations ORDER BY sort_order ASC
  `;
  return NextResponse.json(hosts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { memberName } = await req.json();
  if (!memberName) {
    return NextResponse.json({ error: "Member name required" }, { status: 400 });
  }

  const sql = getDb();

  // Get max sort order
  const maxResult = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM host_rotations`;
  const nextOrder = Number(maxResult[0].max_order) + 1;

  const rows = await sql`
    INSERT INTO host_rotations (member_name, sort_order)
    VALUES (${memberName}, ${nextOrder})
    ON CONFLICT (member_name) DO NOTHING
    RETURNING *
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Member already in rotation" }, { status: 409 });
  }

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, optOut, lastHostedDate } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE host_rotations SET
      opt_out = COALESCE(${optOut !== undefined ? optOut : null}, opt_out),
      last_hosted_at = COALESCE(${lastHostedDate || null}, last_hosted_at)
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
