import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { phaseSchema } from "@/lib/validators";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function GET() {
  const phases = await db.hackathonPhase.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ phases });
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("phase:manage");
    const body = await req.json();
    const parsed = phaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const phase = await db.hackathonPhase.create({ data: parsed.data });
    await recordChange({
      section: "PHASE",
      entityId: phase.id,
      entityType: "HackathonPhase",
      action: "CREATE",
      previousState: null,
      newState: snapshotRow(phase),
      changedById: ctx.userId,
    });
    return NextResponse.json({ phase }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
