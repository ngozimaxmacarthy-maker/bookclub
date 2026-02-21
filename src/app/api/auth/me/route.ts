import { NextResponse } from "next/server";
import { getMemberName } from "@/lib/session";

export async function GET() {
  const name = await getMemberName();
  if (!name) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, name });
}
