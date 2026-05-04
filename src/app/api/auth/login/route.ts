import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { password, memberName } = await req.json();

  if (!memberName || typeof memberName !== "string" || !memberName.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sql = getDb();

  // Determine role
  let role: "admin" | "member" | null = null;

  if (adminPassword && password === adminPassword) {
    role = "admin";
  } else {
    // Check DB for member password (admin may have changed it), fall back to env var
    let memberPassword = process.env.APP_PASSWORD || "bookclub";
    try {
      const settings = await sql`SELECT value FROM app_settings WHERE key = 'member_password'`;
      if (settings[0]?.value) memberPassword = settings[0].value;
    } catch {
      // app_settings table not yet created — use env var / default
    }
    if (password === memberPassword) {
      role = "member";
    }
  }

  if (!role) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const name = memberName.trim();

  // Upsert member
  await sql`
    INSERT INTO members (name) VALUES (${name})
    ON CONFLICT (name) DO NOTHING
  `;

  const session = await getSession();
  session.memberName = name;
  session.isLoggedIn = true;
  session.role = role;
  await session.save();

  return NextResponse.json({ ok: true, memberName: name, role });
}
