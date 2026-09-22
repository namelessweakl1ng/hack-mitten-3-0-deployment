import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";

/**
 * POST /api/admin/teams/:id/reject
 * Body: { reason: string }
 * Rejects the team entirely. Team status → REJECTED.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("team:reject");
    const { id } = await params;
    const body = await req.json();
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 3) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const team = await db.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "APPROVED") {
      return NextResponse.json({ error: "Cannot reject an approved team" }, { status: 400 });
    }

    const updated = await db.team.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await writeAudit({
      userId: ctx.userId,
      teamId: id,
      action: "TEAM_REJECTED",
      detail: reason,
    });

    return NextResponse.json({ team: updated });
  } catch (err) {
    return jsonError(err);
  }
}
