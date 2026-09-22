import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const cfg = await db.eventConfig.findUnique({ where: { id: "singleton" } });
  if (!cfg) {
    return NextResponse.json({ error: "Event config not initialized" }, { status: 500 });
  }
  // Parse social links JSON safely
  let socialLinks: any = {};
  try { socialLinks = JSON.parse(cfg.socialLinks); } catch { /* ignore */ }
  return NextResponse.json({ config: { ...cfg, socialLinks } });
}
