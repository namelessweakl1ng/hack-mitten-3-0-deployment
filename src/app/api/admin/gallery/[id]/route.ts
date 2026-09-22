import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { galleryItemSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("gallery:manage");
    const { id } = await params;
    const form = await req.formData();
    const payload: any = {
      title: (form.get("title") as string) || undefined,
      caption: (form.get("caption") as string) || undefined,
      year: (form.get("year") as string) || undefined,
      sortOrder: form.get("sortOrder") ? parseInt(form.get("sortOrder") as string) : undefined,
      visible: form.get("visible") === null ? undefined : form.get("visible") !== "false",
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const parsed = galleryItemSchema.partial().safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const file = form.get("image");
    let imageUrl: string | undefined;
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "gallery" });
      imageUrl = stored.relativePath;
    }
    const previous = await db.galleryItem.findUnique({ where: { id } });
    const item = await db.galleryItem.update({
      where: { id },
      data: { ...parsed.data, ...(imageUrl ? { imageUrl } : {}) } as any,
    });
    await recordChange({
      section: "GALLERY",
      entityId: id,
      entityType: "GalleryItem",
      action: "UPDATE",
      previousState: previous ? snapshotRow(previous) : null,
      newState: snapshotRow(item),
      changedById: ctx.userId,
    });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("gallery:manage");
    const { id } = await params;
    const previous = await db.galleryItem.findUnique({ where: { id } });
    await db.galleryItem.delete({ where: { id } });
    await recordChange({
      section: "GALLERY",
      entityId: id,
      entityType: "GalleryItem",
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
