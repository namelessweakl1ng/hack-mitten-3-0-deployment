import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, jsonError } from "@/lib/api-auth";
import { winnerSchema } from "@/lib/validators";
import { storeImage, UploadError } from "@/lib/upload";
import { recordChange, snapshotRow } from "@/lib/change-history";

export async function GET() {
  const winners = await db.winner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ winners });
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("winner:manage");
    const form = await req.formData();
    const payload: any = {
      position: parseInt(form.get("position") as string) || 0,
      positionLabel: (form.get("positionLabel") as string) || "1st Place",
      teamName: form.get("teamName") as string,
      prize: (form.get("prize") as string) || null,
      description: (form.get("description") as string) || null,
      sortOrder: parseInt(form.get("sortOrder") as string) || 0,
      visible: form.get("visible") !== "false",
    };
    const parsed = winnerSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    let imageUrl: string | null = null;
    const file = form.get("image");
    if (file instanceof File) {
      const stored = await storeImage({ file, prefix: "winner" });
      imageUrl = stored.relativePath;
    }
    const winner = await db.winner.create({
      data: { ...parsed.data, prize: parsed.data.prize || null, description: parsed.data.description || null, imageUrl },
    });
    await recordChange({
      section: "WINNER",
      entityId: winner.id,
      entityType: "Winner",
      action: "CREATE",
      previousState: null,
      newState: snapshotRow(winner),
      changedById: ctx.userId,
    });
    return NextResponse.json({ winner }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return jsonError(err);
  }
}
