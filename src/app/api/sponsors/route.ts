import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const sponsors = await db.sponsor.findMany({
    where: { visible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ sponsors });
}
