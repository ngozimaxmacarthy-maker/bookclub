import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { password, name } = await req.json();

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword || password !== appPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const trimmedName = name?.trim();
  if (!trimmedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Upsert the member record
  await prisma.member.upsert({
    where: { name: trimmedName },
    update: {},
    create: { name: trimmedName },
  });

  const session = await getSession();
  session.authenticated = true;
  session.memberName = trimmedName;
  await session.save();

  return NextResponse.json({ ok: true, name: trimmedName });
}
