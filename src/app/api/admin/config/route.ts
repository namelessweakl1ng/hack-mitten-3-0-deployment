import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { recordChange, snapshotRow } from "@/lib/change-history";
import { storeImage, UploadError } from "@/lib/upload";
import { ensureSingletonEventConfig } from "@/lib/bootstrap";

const ALLOWED_STRING_FIELDS = [
  "eventName", "edition", "tagline", "description",
  "eventStartDate", "eventStartTime", "eventEndDate", "eventEndTime",
  "eventTimezone", "registrationDeadline", "registrationFee", "prizePool",
  "heroHeading", "heroEdition", "heroSubtitle", "heroDescription",
  "heroCtaText", "heroCtaLink",
  "aboutHeading", "aboutDescription", "aboutStatDuration", "aboutStatTeamSize",
  "aboutStatFee", "aboutStatPrize", "aboutStatVenue",
  "footerText", "collegeName", "contactEmail",
  "upiId",
  "winnersHeading", "winnersSubheading",
] as const;

const ALLOWED_INT_FIELDS = ["eventDurationHours", "registrationCapacity"] as const;
const ALLOWED_BOOL_FIELDS = ["heroVisible", "winnersVisible", "registrationsOpen"] as const;

/**
 * GET /api/admin/config — returns the full event config (for admin editor)
 */
export async function GET() {
  try {
    await requirePermission("config:edit");
    const cfg = await db.eventConfig.findUnique({ where: { id: "singleton" } });
    if (!cfg) return NextResponse.json({ error: "Not initialized" }, { status: 500 });
    let socialLinks: any = {};
    try { socialLinks = JSON.parse(cfg.socialLinks); } catch { /* ignore */ }
    return NextResponse.json({ config: { ...cfg, socialLinks } });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * PATCH /api/admin/config
 * Updates the event config singleton. Super-admin only.
 * Accepts JSON for text fields, or multipart form for file uploads (collegeLogo, upiQr).
 */
export async function PATCH(req: Request) {
  try {
    const ctx = await requirePermission("config:edit");
    const contentType = req.headers.get("content-type") || "";

    const allowed: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      // Handle file uploads (college logo, UPI QR)
      const form = await req.formData();
      for (const k of ALLOWED_STRING_FIELDS) {
        const v = form.get(k);
        if (typeof v === "string") allowed[k] = v;
      }
      for (const k of ALLOWED_INT_FIELDS) {
        const v = form.get(k);
        if (v !== null && v !== undefined) {
          // Allow different defaults per field
          if (k === "registrationCapacity") allowed[k] = parseInt(v as string) || 60;
          else allowed[k] = parseInt(v as string) || 24;
        }
      }
      for (const k of ALLOWED_BOOL_FIELDS) {
        const v = form.get(k);
        if (v !== null) allowed[k] = v === "true";
      }
      const socialLinks = form.get("socialLinks");
      if (typeof socialLinks === "string" && socialLinks) {
        allowed.socialLinks = socialLinks;
      }

      // Handle file uploads
      const collegeLogo = form.get("collegeLogo");
      if (collegeLogo instanceof File) {
        const stored = await storeImage({ file: collegeLogo, prefix: "college-logo" });
        allowed.collegeLogoUrl = stored.relativePath;
      }
      const upiQr = form.get("upiQr");
      if (upiQr instanceof File) {
        const stored = await storeImage({ file: upiQr, prefix: "upi-qr" });
        allowed.upiQrUrl = stored.relativePath;
      }
    } else {
      // JSON body
      const body = await req.json();
      for (const k of ALLOWED_STRING_FIELDS) {
        if (typeof body[k] === "string") allowed[k] = body[k];
      }
      for (const k of ALLOWED_INT_FIELDS) {
        if (typeof body[k] === "number" && Number.isFinite(body[k])) allowed[k] = body[k];
      }
      for (const k of ALLOWED_BOOL_FIELDS) {
        if (typeof body[k] === "boolean") allowed[k] = body[k];
      }
      if (body.socialLinks && typeof body.socialLinks === "object") {
        allowed.socialLinks = JSON.stringify(body.socialLinks);
      }
    }

    const existing = await db.eventConfig.findUnique({ where: { id: "singleton" } });
    const current = existing ?? (await ensureSingletonEventConfig());

    // Capture previous state for rollback
    const previous = current;
    const previousSnapshot = previous ? snapshotRow(previous) : null;

    const updated = await db.eventConfig.update({
      where: { id: "singleton" },
      data: allowed,
    });

    await recordChange({
      section: "EVENT_CONFIG",
      entityId: "singleton",
      entityType: "EventConfig",
      action: "UPDATE",
      previousState: previousSnapshot,
      newState: snapshotRow(updated),
      changedById: ctx.userId,
    });

    await writeAudit({
      userId: ctx.userId,
      action: "CONFIG_UPDATED",
      detail: `Fields: ${Object.keys(allowed).join(", ") || "(none)"}`,
    });
    return NextResponse.json({ config: updated });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}
