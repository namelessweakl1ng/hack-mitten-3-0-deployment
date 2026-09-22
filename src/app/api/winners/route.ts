import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/winners — returns winners only if EventConfig.winnersVisible === true.
 * If winners are hidden, returns an empty list (so the public section conditionally renders).
 */
export async function GET() {
  const cfg = await db.eventConfig.findUnique({ where: { id: "singleton" } });
  if (!cfg?.winnersVisible) {
    return NextResponse.json({ winners: [], visible: false });
  }
  const winners = await db.winner.findMany({
    where: { visible: true },
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ winners, visible: true, heading: cfg.winnersHeading, subheading: cfg.winnersSubheading });
}
