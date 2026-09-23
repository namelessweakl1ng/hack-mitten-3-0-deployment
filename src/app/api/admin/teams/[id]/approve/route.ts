import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { recordChange, snapshotRow } from "@/lib/change-history";
import { sendEmail, approvalEmailHtml, approvalEmailText } from "@/lib/email";
import {
  generateQrToken,
  generateRegistrationId,
  generateParticipantId,
  nextRegistrationSequence,
} from "@/lib/constants";

/**
 * POST /api/admin/teams/:id/approve
 *
 * Pre-conditions:
 *  - team.payment.status === VERIFIED
 *
 * Side effects (all in a transaction):
 *  - assign unique sequential registrationId (HM3-XXXXX)
 *  - assign participantId + qrToken to each member
 *  - mark team APPROVED
 *  - mark each participant passVerified = true
 *  - write audit log + change history (enables rollback)
 *  - send the approval email to the team leader (only on the first approval)
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("team:approve");
    const { id } = await params;

    const team = await db.team.findUnique({
      where: { id },
      include: { payment: true, members: true },
    });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "APPROVED") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }
    if (!team.payment || team.payment.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Cannot approve team — payment not verified" },
        { status: 400 },
      );
    }

    // Capture previous state for rollback
    const previousSnapshot = snapshotRow(team);
    // Detect the genuine first-time PENDING → APPROVED transition.
    // We only send approval emails when this is the team's FIRST approval —
    // i.e. the team has no registrationId yet (a re-approval after a revert
    // preserves the registrationId, so we skip the email in that case).
    // We also confirm the payment was actually verified (status === VERIFIED),
    // which is enforced above.
    const isFirstApproval = !team.registrationId;

    // Determine the next registration sequence number
    const existingApproved = await db.team.count({
      where: { status: "APPROVED", registrationId: { not: null } },
    });
    const seq = await nextRegistrationSequence(existingApproved);
    const regId = generateRegistrationId(seq);

    // Transaction-safe generation of IDs and tokens
    const result = await db.$transaction(async (tx) => {
      const updatedTeam = await tx.team.update({
        where: { id },
        data: { status: "APPROVED", registrationId: regId },
      });

      // Assign participant IDs + opaque QR tokens
      const members = await tx.participant.findMany({
        where: { teamId: id },
        orderBy: { createdAt: "asc" },
      });
      for (let i = 0; i < members.length; i++) {
        const p = members[i];
        await tx.participant.update({
          where: { id: p.id },
          data: {
            participantId: generateParticipantId(seq, i + 1),
            qrToken: generateQrToken(),
            passVerified: true,
          },
        });
      }

      return updatedTeam;
    });

    // Record change history — enables rollback to previous state (PAYMENT_VERIFIED)
    await recordChange({
      section: "TEAM",
      entityId: id,
      entityType: "Team",
      action: "APPROVE",
      previousState: previousSnapshot,
      newState: snapshotRow(result),
      changedById: ctx.userId,
    });

    await writeAudit({
      userId: ctx.userId,
      teamId: id,
      action: "TEAM_APPROVED",
      detail: `Registration ID ${regId} · ${team.members.length} participants${isFirstApproval ? "" : " (re-approval — no email sent)"}`,
    });

    // Send one approval email to the leader — ONLY on the first approval.
    // Re-approvals after a revert (registrationId already existed) skip the email
    // to avoid duplicate notifications.
    const refreshed = await db.team.findUnique({
      where: { id },
      include: { members: true, payment: true },
    });

    if (isFirstApproval) {
      // Fire-and-forget email sending — don't block the response.
      // Failures are logged but never roll back the approval.
      const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
      const leader = refreshed?.members.find((member) => member.isLeader);
      if (!leader?.email || !leader.qrToken) {
        console.error(`[email] approval email skipped for team ${team.teamName}: leader email or pass is missing`);
      } else {
        const passUrl = baseUrl ? `${baseUrl}/pass/${leader.qrToken}` : `/pass/${leader.qrToken}`;
        sendEmail({
          to: leader.email,
          subject: "Hackmitten 3.0 — Team Approved",
          html: approvalEmailHtml({
            participantName: leader.fullName,
            teamName: team.teamName,
            registrationId: regId,
            participantId: leader.participantId ?? "",
            passUrl,
            whatsappGroupUrl: "https://chat.whatsapp.com/CKjNXeNALPzAymQ0GhfMCj",
          }),
          text: approvalEmailText({
            participantName: leader.fullName,
            teamName: team.teamName,
            registrationId: regId,
            participantId: leader.participantId ?? "",
            passUrl,
            whatsappGroupUrl: "https://chat.whatsapp.com/CKjNXeNALPzAymQ0GhfMCj",
          }),
        })
          .then((res) => {
            if (!res.success) {
              console.error(`[email] approval email failed for ${leader.email}: ${res.message} (provider: ${res.provider})`);
            } else {
              console.log(`[email] approval email sent to ${leader.email} via ${res.provider}`);
            }
          })
          .catch((err) => console.error("[email] unexpected approval email error", err));
      }
    } else {
      console.log(`[email] skipping approval email for team ${team.teamName} — re-approval (registrationId ${team.registrationId} already existed)`);
    }

    return NextResponse.json({ team: refreshed });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * POST /api/admin/teams/:id/approve with action=revert
 * Reverts an approved team back to PAYMENT_VERIFIED (undo accidental approval).
 * Preserves registrationId and participant credentials so they can be re-approved if needed.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("team:approve");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (body?.action !== "revert") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    const team = await db.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status !== "APPROVED") {
      return NextResponse.json({ error: "Team is not approved" }, { status: 400 });
    }
    const previousSnapshot = snapshotRow(team);
    const updated = await db.team.update({
      where: { id },
      data: { status: "PAYMENT_VERIFIED" },
    });
    await recordChange({
      section: "TEAM",
      entityId: id,
      entityType: "Team",
      action: "REVERT_APPROVAL",
      previousState: previousSnapshot,
      newState: snapshotRow(updated),
      changedById: ctx.userId,
    });
    await writeAudit({
      userId: ctx.userId,
      teamId: id,
      action: "TEAM_APPROVAL_REVERTED",
      detail: `Reverted from APPROVED to PAYMENT_VERIFIED (registration ID ${team.registrationId} preserved)`,
    });
    return NextResponse.json({ team: updated });
  } catch (err) {
    return jsonError(err);
  }
}
