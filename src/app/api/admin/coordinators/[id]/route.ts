import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";
import { z } from "zod";

const coordinatorUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.string().min(1).max(100).optional(),
  department: z.string().max(100).optional().or(z.literal("")).or(z.null()),
  type: z.enum(["STUDENT", "FACULTY"]).optional(),
  phone: z.string().max(30).optional().or(z.literal("")).or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  photoUrl: z.string().max(500).optional(),
  isLead: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("coordinator:manage");
    const { id } = await params;
    const form = await req.formData();
    const payload: any = {};
    for (const key of ["name", "role", "department", "type", "phone", "email"]) {
      const v = form.get(key);
      if (v !== null) payload[key] = v || null;
    }
    if (form.get("isLead") !== null) payload.isLead = form.get("isLead") === "true";
    if (form.get("sortOrder") !== null) payload.sortOrder = parseInt(form.get("sortOrder") as string) || 0;
    if (form.get("visible") !== null) payload.visible = form.get("visible") !== "false";

    const parsed = coordinatorUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const file = form.get("photo");
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "coordinator" });
      parsed.data.photoUrl = stored.relativePath;
    }
    const previous = await db.coordinatorProfile.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const coordinator = await db.coordinatorProfile.update({ where: { id }, data: parsed.data as any });
    await recordChange({
      section: "COORDINATOR",
      entityId: id,
      entityType: "CoordinatorProfile",
      action: "UPDATE",
      previousState: snapshotRow(previous),
      newState: snapshotRow(coordinator),
      changedById: ctx.userId,
    });
    return NextResponse.json({ coordinator });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requirePermission("coordinator:manage");
    const { id } = await params;
    const previous = await db.coordinatorProfile.findUnique({ where: { id } });
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.coordinatorProfile.delete({ where: { id } });
    await recordChange({
      section: "COORDINATOR",
      entityId: id,
      entityType: "CoordinatorProfile",
      action: "DELETE",
      previousState: snapshotRow(previous),
      newState: null,
      changedById: ctx.userId,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return jsonError(err);
  }
}
