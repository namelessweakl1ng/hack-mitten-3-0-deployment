import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { phaseSchema } from "@/lib/validators";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("phase:manage");
    const { id } = await params;
    const body = await req.json();
    const parsed = phaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const previous = await db.hackathonPhase.findUnique({ where: { id } });
    const phase = await db.hackathonPhase.update({ where: { id }, data: parsed.data });
    await recordChange({
      section: "PHASE",
      entityId: id,
      entityType: "HackathonPhase",
      action: "UPDATE",
      previousState: previous ? snapshotRow(previous) : null,
      newState: snapshotRow(phase),
      changedById: ctx.userId,
    });
    return NextResponse.json({ phase });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("phase:manage");
    const { id } = await params;
    const previous = await db.hackathonPhase.findUnique({ where: { id } });
    await db.hackathonPhase.delete({ where: { id } });
    await recordChange({
      section: "PHASE",
      entityId: id,
      entityType: "HackathonPhase",
      action: "DELETE",
      previousState: previous ? snapshotRow(previous) : null,
      newState: null,
      changedById: ctx.userId,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
