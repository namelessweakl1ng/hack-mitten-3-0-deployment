import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { galleryItemSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function GET() {
  const items = await db.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("gallery:manage");
    const form = await req.formData();
    const payload: any = {
      title: form.get("title") as string,
      caption: (form.get("caption") as string) || null,
      year: (form.get("year") as string) || String(new Date().getFullYear()),
      sortOrder: parseInt(form.get("sortOrder") as string) || 0,
      visible: form.get("visible") !== "false",
    };
    const parsed = galleryItemSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }
    const stored = await storeImage({ file, prefix: "gallery" });
    const item = await db.galleryItem.create({
      data: { ...parsed.data, caption: parsed.data.caption || null, imageUrl: stored.relativePath },
    });
    await recordChange({
      section: "GALLERY",
      entityId: item.id,
      entityType: "GalleryItem",
      action: "CREATE",
      previousState: null,
      newState: snapshotRow(item),
      changedById: ctx.userId,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}
