import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";
import { z } from "zod";

const coordinatorSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(1).max(100),
  department: z.string().max(100).optional().or(z.literal("")).or(z.null()),
  type: z.enum(["STUDENT", "FACULTY"]).default("STUDENT"),
  phone: z.string().max(30).optional().or(z.literal("")).or(z.null()),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  isLead: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

export async function GET() {
  try {
    await requirePermission("coordinator:manage");
    const coordinators = await db.coordinatorProfile.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ coordinators });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("coordinator:manage");
    const form = await req.formData();
    const payload: any = {
      name: form.get("name") as string,
      role: (form.get("role") as string) || "Coordinator",
      department: (form.get("department") as string) || null,
      type: (form.get("type") as string) || "STUDENT",
      phone: (form.get("phone") as string) || null,
      email: (form.get("email") as string) || null,
      isLead: form.get("isLead") === "true",
      sortOrder: parseInt(form.get("sortOrder") as string) || 0,
      visible: form.get("visible") !== "false",
    };
    const parsed = coordinatorSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    let photoUrl: string | null = null;
    const file = form.get("photo");
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "coordinator" });
      photoUrl = stored.relativePath;
    }
    const coordinator = await db.coordinatorProfile.create({
      data: {
        ...parsed.data,
        department: parsed.data.department || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        photoUrl,
      },
    });
    await recordChange({
      section: "COORDINATOR",
      entityId: coordinator.id,
      entityType: "CoordinatorProfile",
      action: "CREATE",
      previousState: null,
      newState: snapshotRow(coordinator),
      changedById: ctx.userId,
    });
    return NextResponse.json({ coordinator }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}
