import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const coordinators = await db.coordinatorProfile.findMany({
    where: { visible: true },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ coordinators });
}
