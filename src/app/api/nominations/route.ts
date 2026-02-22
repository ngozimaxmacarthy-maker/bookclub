import { NextResponse } from "next/server";

// This route has been moved to /api/voting
// This stub exists to prevent stale Turbopack cache errors
export async function GET() {
  return NextResponse.json({ moved: "/api/voting" });
}

export async function POST() {
  return NextResponse.json({ moved: "/api/voting" });
}
