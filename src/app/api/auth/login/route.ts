import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { password, memberName } = await req.json();
  const appPassword = process.env.APP_PASSWORD || "bookclub";

  if (password !== appPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  if (!memberName || typeof memberName !== "string" || !memberName.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const name = memberName.trim();
  const sql = getDb();

  // Upsert member
  await sql`
    INSERT INTO members (name) VALUES (${name})
    ON CONFLICT (name) DO NOTHING
  `;

  const session = await getSession();
  session.memberName = name;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true, memberName: name });
}
