import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberName } from "@/lib/session";

export async function GET() {
  const hosts = await prisma.hostRotation.findMany({
    include: { member: true },
    orderBy: { order: "asc" },
  });

  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ hosts, members });
}

export async function POST(req: NextRequest) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Add or update host rotation entry
  const { memberName, order, optOut } = await req.json();

  const entry = await prisma.hostRotation.upsert({
    where: { memberName },
    update: { order, optOut: optOut ?? false },
    create: { memberName, order, optOut: optOut ?? false },
  });

  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const member = await getMemberName();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rotations } = await req.json();

  // rotations: Array<{ memberName, order, optOut, lastHostedAt? }>
  const results = await Promise.all(
    rotations.map((r: { memberName: string; order: number; optOut: boolean; lastHostedAt?: string }) =>
      prisma.hostRotation.upsert({
        where: { memberName: r.memberName },
        update: {
          order: r.order,
          optOut: r.optOut,
          lastHostedAt: r.lastHostedAt ? new Date(r.lastHostedAt) : undefined,
        },
        create: {
          memberName: r.memberName,
          order: r.order,
          optOut: r.optOut ?? false,
        },
      })
    )
  );

  return NextResponse.json(results);
}
