import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// PUT /api/admin/password
// Admin only — update the shared member password
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { newPassword } = await req.json();
  if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('member_password', ${newPassword.trim()}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;

  return NextResponse.json({ ok: true });
}
