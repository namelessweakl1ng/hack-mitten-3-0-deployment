import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import type { ChangeHistorySection } from "@prisma/client";

/**
 * POST /api/admin/change-history/:id/rollback
 *
 * Restores the previousState captured in the change-history entry.
 * The rollback itself is also recorded as a NEW change-history entry
 * (so the history is never destroyed — A → B → A is fully visible).
 *
 * The original entry is marked rolledBack=true.
 *
 * Supported sections: EVENT_CONFIG, HERO, ABOUT, PHASE, GALLERY, SPONSOR,
 * COORDINATOR, WINNER, MEAL, TEAM, PAYMENT.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("audit:view");
    const { id } = await params;

    const entry = await db.changeHistory.findUnique({ where: { id } });
    if (!entry) {
      return NextResponse.json({ error: "Change history entry not found" }, { status: 404 });
    }
    if (entry.rolledBack) {
      return NextResponse.json({ error: "This change has already been rolled back" }, { status: 400 });
    }
    if (entry.action === "CREATE") {
      return NextResponse.json(
        { error: "Cannot rollback a CREATE — delete the created entity instead" },
        { status: 400 },
      );
    }
    if (entry.action === "DELETE") {
      // Restoring a deleted row — we need to recreate it from previousState
      const restored = await restoreDeletedRow(entry.section as ChangeHistorySection, entry.previousState);
      await db.changeHistory.update({
        where: { id },
        data: { rolledBack: true, rolledBackById: ctx.userId, rolledBackAt: new Date() },
      });
      await writeAudit({
        userId: ctx.userId,
        action: "ROLLBACK",
        detail: `Rolled back ${entry.section} ${entry.action} — restored ${restored ?? "entity"}`,
      });
      return NextResponse.json({ success: true, restored });
    }

    // UPDATE / APPROVE / REJECT / VERIFY — restore previousState to the row
    const previousState = safeParse(entry.previousState);
    if (!previousState) {
      return NextResponse.json({ error: "Previous state unavailable — cannot rollback" }, { status: 400 });
    }

    // First, capture the CURRENT state as a new change-history entry (so rollback is reversible too)
    const currentState = await fetchCurrentState(entry.section as ChangeHistorySection, entry.entityId, entry.entityType);
    if (currentState !== null) {
      await db.changeHistory.create({
        data: {
          section: entry.section,
          entityId: entry.entityId,
          entityType: entry.entityType,
          action: "ROLLBACK",
          previousState: JSON.stringify(currentState),
          newState: entry.previousState, // about to be applied
          changedById: ctx.userId,
        },
      });
    }

    // Apply the rollback — restore previousState to the row
    await applyRestore(entry.section as ChangeHistorySection, entry.entityId, entry.entityType, previousState);

    // Mark original entry as rolled back
    await db.changeHistory.update({
      where: { id },
      data: { rolledBack: true, rolledBackById: ctx.userId, rolledBackAt: new Date() },
    });

    await writeAudit({
      userId: ctx.userId,
      action: "ROLLBACK",
      detail: `Rolled back ${entry.section} ${entry.action} on ${entry.entityType} ${entry.entityId}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}

function safeParse(s: string | null): any {
  if (!s || s === "null") return null;
  try { return JSON.parse(s); } catch { return null; }
}

async function fetchCurrentState(section: ChangeHistorySection, entityId: string, _entityType: string): Promise<any> {
  switch (section) {
    case "EVENT_CONFIG":
    case "HERO":
    case "ABOUT":
      return await db.eventConfig.findUnique({ where: { id: "singleton" } });
    case "PHASE":
      return await db.hackathonPhase.findUnique({ where: { id: entityId } });
    case "GALLERY":
      return await db.galleryItem.findUnique({ where: { id: entityId } });
    case "SPONSOR":
      return await db.sponsor.findUnique({ where: { id: entityId } });
    case "COORDINATOR":
      return await db.coordinatorProfile.findUnique({ where: { id: entityId } });
    case "WINNER":
      return await db.winner.findUnique({ where: { id: entityId } });
    case "MEAL":
      return await db.meal.findUnique({ where: { id: entityId } });
    case "TEAM":
      return await db.team.findUnique({ where: { id: entityId } });
    case "PAYMENT":
      return await db.payment.findUnique({ where: { id: entityId } });
    default:
      return null;
  }
}

async function applyRestore(section: ChangeHistorySection, entityId: string, entityType: string, previousState: any): Promise<void> {
  // Don't auto-convert dates — keep all values as-is from the snapshot (strings stay strings).
  // Only the TEAM and PAYMENT sections need explicit Date conversion for known DateTime fields.
  const restored = { ...previousState };
  // Strip read-only fields that Prisma won't accept on update
  delete restored.createdAt;
  delete restored.updatedAt;
  delete restored.id;

  switch (section) {
    case "EVENT_CONFIG":
    case "HERO":
    case "ABOUT":
      await db.eventConfig.update({ where: { id: "singleton" }, data: restored });
      break;
    case "PHASE":
      await db.hackathonPhase.update({ where: { id: entityId }, data: restored });
      break;
    case "GALLERY":
      await db.galleryItem.update({ where: { id: entityId }, data: restored });
      break;
    case "SPONSOR":
      await db.sponsor.update({ where: { id: entityId }, data: restored });
      break;
    case "COORDINATOR":
      await db.coordinatorProfile.update({ where: { id: entityId }, data: restored });
      break;
    case "WINNER":
      await db.winner.update({ where: { id: entityId }, data: restored });
      break;
    case "MEAL":
      await db.meal.update({ where: { id: entityId }, data: restored });
      break;
    case "TEAM":
      // For teams — only restore scalar fields (status, registrationId). Don't touch members.
      // Don't convert createdAt/updatedAt (they're read-only).
      await db.team.update({
        where: { id: entityId },
        data: {
          status: restored.status,
          registrationId: restored.registrationId,
          college: restored.college,
        },
      });
      break;
    case "PAYMENT":
      await db.payment.update({
        where: { id: entityId },
        data: {
          status: restored.status,
          transactionId: restored.transactionId,
          rejectionReason: restored.rejectionReason,
          verifiedById: restored.verifiedById,
          verifiedAt: restored.verifiedAt ? new Date(restored.verifiedAt) : null,
        },
      });
      break;
    default:
      throw new Error(`Rollback not supported for section ${section}`);
  }
}

async function restoreDeletedRow(section: ChangeHistorySection, previousStateJson: string | null): Promise<string | null> {
  if (!previousStateJson || previousStateJson === "null") return null;
  const previousState = restoreDates(safeParse(previousStateJson));
  // Don't try to recreate with the original cuid (could collide). Use a new id.
  const { id: _ignored, ...data } = previousState;
  switch (section) {
    case "PHASE": {
      const r = await db.hackathonPhase.create({ data });
      return r.id;
    }
    case "GALLERY": {
      const r = await db.galleryItem.create({ data });
      return r.id;
    }
    case "SPONSOR": {
      const r = await db.sponsor.create({ data });
      return r.id;
    }
    case "COORDINATOR": {
      const r = await db.coordinatorProfile.create({ data });
      return r.id;
    }
    case "WINNER": {
      const r = await db.winner.create({ data });
      return r.id;
    }
    case "MEAL": {
      const r = await db.meal.create({ data });
      return r.id;
    }
    default:
      throw new Error(`Cannot restore deleted row for section ${section}`);
  }
}

function restoreDates(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    // Skip read-only / Prisma-managed fields / PK (can't update id during UPDATE)
    if (k === "createdAt" || k === "updatedAt" || k === "id") continue;
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) { out[k] = d; continue; }
    }
    out[k] = v;
  }
  return out;
}
