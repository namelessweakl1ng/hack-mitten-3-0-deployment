import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, requirePermission } from "@/lib/api-auth";
import { readPrivateFile } from "@/lib/upload";
import { participantImageFilename } from "@/lib/participant-image-filename";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("registration:view");
    const { id } = await params;
    const participant = await db.participant.findUnique({
      where: { id },
      select: { fullName: true, participantImagePath: true, participantImageMimeType: true },
    });
    if (!participant?.participantImagePath) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    const image = await readPrivateFile(participant.participantImagePath);
    if (!image || !["image/jpeg", "image/png", "image/webp"].includes(participant.participantImageMimeType ?? "")) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": participant.participantImageMimeType!,
        "Content-Disposition": `${new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(participantImageFilename(participant.fullName, image.contentType))}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
