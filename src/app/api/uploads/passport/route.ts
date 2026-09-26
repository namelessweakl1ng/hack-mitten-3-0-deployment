import { NextResponse } from "next/server";
import { storePassportImage, UploadError } from "@/lib/upload";
import { jsonError } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const stored = await storePassportImage({
      file,
      participantId: "passport",
      prefix: "passports",
    });

    return NextResponse.json({
      file: {
        path: stored.relativePath,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return jsonError(err);
  }
}
