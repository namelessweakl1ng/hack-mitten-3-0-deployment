import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { sponsorSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function GET() {
  const sponsors = await db.sponsor.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ sponsors });
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("sponsor:manage");
    const form = await req.formData();
    const payload: any = {
      name: form.get("name") as string,
      websiteUrl: (form.get("websiteUrl") as string) || "",
      tier: (form.get("tier") as string) || "PARTNER",
      customTier: (form.get("customTier") as string) || null,
      sortOrder: parseInt(form.get("sortOrder") as string) || 0,
      visible: form.get("visible") !== "false",
    };
    const parsed = sponsorSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    let logoUrl = "";
    const file = form.get("logo");
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "sponsor" });
      logoUrl = stored.relativePath;
    }
    const sponsor = await db.sponsor.create({
      data: { ...parsed.data, websiteUrl: parsed.data.websiteUrl || null, logoUrl },
    });
    await recordChange({
      section: "SPONSOR",
      entityId: sponsor.id,
      entityType: "Sponsor",
      action: "CREATE",
      previousState: null,
      newState: snapshotRow(sponsor),
      changedById: ctx.userId,
    });
    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}
