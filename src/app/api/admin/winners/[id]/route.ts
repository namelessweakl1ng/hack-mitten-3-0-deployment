import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { winnerSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("winner:manage");
    const { id } = await params;
    const form = await req.formData();
    const payload: any = {
      position: form.get("position") !== null ? parseInt(form.get("position") as string) : undefined,
      positionLabel: (form.get("positionLabel") as string) || undefined,
      teamName: (form.get("teamName") as string) || undefined,
      prize: (form.get("prize") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      sortOrder: form.get("sortOrder") ? parseInt(form.get("sortOrder") as string) : undefined,
      visible: form.get("visible") === null ? undefined : form.get("visible") !== "false",
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const parsed = winnerSchema.partial().safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const file = form.get("image");
    let imageUrl: string | undefined;
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "winner" });
      imageUrl = stored.relativePath;
    }
    const previous = await db.winner.findUnique({ where: { id } });
    const winner = await db.winner.update({
      where: { id },
      data: { ...parsed.data, ...(imageUrl ? { imageUrl } : {}) } as any,
    });
    await recordChange({
      section: "WINNER",
      entityId: id,
      entityType: "Winner",
      action: "UPDATE",
      previousState: previous ? snapshotRow(previous) : null,
      newState: snapshotRow(winner),
      changedById: ctx.userId,
    });
    return NextResponse.json({ winner });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("winner:manage");
    const { id } = await params;
    const previous = await db.winner.findUnique({ where: { id } });
    await db.winner.delete({ where: { id } });
    await recordChange({
      section: "WINNER",
      entityId: id,
      entityType: "Winner",
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
