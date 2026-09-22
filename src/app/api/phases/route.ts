import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const phases = await db.hackathonPhase.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ phases });
}
