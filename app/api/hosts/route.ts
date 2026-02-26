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

  const body = await req.json();
  const { id, optOut, lastHostedDate, action } = body;
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const sql = getDb();

  // Move up / move down — admin only
  if (action === "moveUp" || action === "moveDown") {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const current = await sql`SELECT * FROM host_rotations WHERE id = ${id}`;
    if (!current.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const cur = current[0];
    const neighbor = action === "moveUp"
      ? await sql`SELECT * FROM host_rotations WHERE sort_order < ${cur.sort_order} ORDER BY sort_order DESC LIMIT 1`
      : await sql`SELECT * FROM host_rotations WHERE sort_order > ${cur.sort_order} ORDER BY sort_order ASC LIMIT 1`;

    if (!neighbor.length) return NextResponse.json({ ok: true });

    await sql`UPDATE host_rotations SET sort_order = ${neighbor[0].sort_order} WHERE id = ${cur.id}`;
    await sql`UPDATE host_rotations SET sort_order = ${cur.sort_order} WHERE id = ${neighbor[0].id}`;

    return NextResponse.json({ ok: true });
  }

  // Regular update (opt out / mark hosted)
  const rows = await sql`
    UPDATE host_rotations SET
      opt_out = COALESCE(${optOut !== undefined ? optOut : null}, opt_out),
      last_hosted_at = COALESCE(${lastHostedDate || null}, last_hosted_at)
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM host_rotations WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
