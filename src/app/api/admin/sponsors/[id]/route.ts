import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { sponsorSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("sponsor:manage");
    const { id } = await params;
    const form = await req.formData();
    const payload: any = {
      name: form.get("name") as string | undefined,
      websiteUrl: (form.get("websiteUrl") as string) || undefined,
      tier: (form.get("tier") as string) || undefined,
      customTier: (form.get("customTier") as string) || undefined,
      sortOrder: form.get("sortOrder") ? parseInt(form.get("sortOrder") as string) : undefined,
      visible: form.get("visible") === null ? undefined : form.get("visible") !== "false",
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const parsed = sponsorSchema.partial().safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const file = form.get("logo");
    let logoUrl: string | undefined;
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "sponsor" });
      logoUrl = stored.relativePath;
    }
    const previous = await db.sponsor.findUnique({ where: { id } });
    const sponsor = await db.sponsor.update({
      where: { id },
      data: { ...parsed.data, ...(logoUrl ? { logoUrl } : {}) } as any,
    });
    await recordChange({
      section: "SPONSOR",
      entityId: id,
      entityType: "Sponsor",
      action: "UPDATE",
      previousState: previous ? snapshotRow(previous) : null,
      newState: snapshotRow(sponsor),
      changedById: ctx.userId,
    });
    return NextResponse.json({ sponsor });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("sponsor:manage");
    const { id } = await params;
    const previous = await db.sponsor.findUnique({ where: { id } });
    await db.sponsor.delete({ where: { id } });
    await recordChange({
      section: "SPONSOR",
      entityId: id,
      entityType: "Sponsor",
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
