import path from "node:path";
import { promises as fs } from "node:fs";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), ".private-uploads");
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 8 * 1024 * 1024;

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}

export class UploadError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface StoredFile {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isPrivate: boolean;
}

function blobConfigured(): boolean {
  const hasStoreId = Boolean(process.env.BLOB_STORE_ID);
  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return Boolean(hasStoreId && (hasToken || isVercelRuntime()));
}

function safeName(prefix: string, mime: string): string {
  const ext = guessExtension(mime);
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${prefix}_${random}.${ext}`;
}

function guessExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "bin";
  }
}

function detectImageMime(head: Uint8Array): string | null {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return "image/gif";
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
      head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image/webp";
  return null;
}

export async function storeImage(opts: {
  file: File;
  prefix: string;
}): Promise<StoredFile> {
  const { file, prefix } = opts;
  return storeFileInternal(file, prefix, false);
}

export async function storePaymentScreenshot(opts: {
  file: File;
  paymentId: string;
}): Promise<StoredFile> {
  const { file, paymentId } = opts;
  return storeFileInternal(file, `pay_${paymentId}`, true);
}

async function storeFileInternal(file: File, prefix: string, isPrivate: boolean): Promise<StoredFile> {
  if (!file) throw new UploadError("No file provided");
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadError(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`);
  }
  if (file.size > MAX_SIZE) {
    throw new UploadError(`File too large (max ${Math.floor(MAX_SIZE / 1024 / 1024)}MB)`);
  }

  const bufHeader = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = detectImageMime(bufHeader);
  if (detected && !ALLOWED_MIME.has(detected)) {
    throw new UploadError("File content does not match allowed image types");
  }
  const effectiveMime = detected ?? file.type;
  const fileName = safeName(prefix, effectiveMime);

  if (isPrivate && isVercelRuntime() && !blobConfigured()) {
    throw new UploadError("Payment screenshot storage is not configured. Connect a Vercel Blob store to this deployment.");
  }

  if (blobConfigured()) {
    return uploadToBlob(file, fileName, isPrivate);
  }

  if (isPrivate) {
    return saveToLocal(file, fileName, true);
  }

  return saveToLocal(file, fileName, false);
}

async function uploadToBlob(file: File, fileName: string, isPrivate: boolean): Promise<StoredFile> {
  const { put } = await import("@vercel/blob");
  const options: Record<string, unknown> = {
    access: isPrivate ? "private" : "public",
    addRandomSuffix: true,
    allowOverwrite: false,
  };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  if (process.env.BLOB_STORE_ID) {
    options.storeId = process.env.BLOB_STORE_ID;
  }

  const result = await put(fileName, file, options as any);
  return {
    relativePath: result.url,
    absolutePath: result.url,
    fileName,
    mimeType: file.type,
    sizeBytes: file.size,
    isPrivate,
  };
}

async function saveToLocal(file: File, fileName: string, isPrivate: boolean): Promise<StoredFile> {
  if (isPrivate) {
    await fs.mkdir(PRIVATE_UPLOAD_ROOT, { recursive: true });
    const abs = path.join(PRIVATE_UPLOAD_ROOT, fileName);
    const buf = await file.arrayBuffer();
    await fs.writeFile(abs, Buffer.from(buf));
    return {
      relativePath: `private://${fileName}`,
      absolutePath: abs,
      fileName,
      mimeType: file.type,
      sizeBytes: file.size,
      isPrivate,
    };
  }
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const abs = path.join(UPLOAD_ROOT, fileName);
  const buf = await file.arrayBuffer();
  await fs.writeFile(abs, Buffer.from(buf));
  return {
    relativePath: `/uploads/${fileName}`,
    absolutePath: abs,
    fileName,
    mimeType: file.type,
    sizeBytes: file.size,
    isPrivate,
  };
}

/**
 * Stream a private payment screenshot from Vercel Blob.
 * Uses get(url, { access: "private" }) which authenticates with the BLOB_READ_WRITE_TOKEN.
 * Returns a ReadableStream + content type, or null if not found.
 */
export async function getPrivateBlobStream(blobUrl: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null> {
  if (!blobConfigured()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const options: Record<string, unknown> = { access: "private" };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      options.token = process.env.BLOB_READ_WRITE_TOKEN;
    }
    if (process.env.BLOB_STORE_ID) {
      options.storeId = process.env.BLOB_STORE_ID;
    }
    const result = await get(blobUrl, options as any);
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return {
      stream: result.stream as ReadableStream<Uint8Array>,
      contentType: result.blob?.contentType || "image/png",
    };
  } catch {
    return null;
  }
}

/**
 * Read a private payment screenshot from the local dev filesystem
 * (stored in .private-uploads/, NOT under public/).
 */
export async function readLocalPrivateFile(relativePath: string): Promise<{
  data: Buffer;
  contentType: string;
} | null> {
  if (relativePath.startsWith("private://")) {
    const fileName = relativePath.replace("private://", "");
    const abs = path.join(PRIVATE_UPLOAD_ROOT, fileName);
    try {
      const data = await fs.readFile(abs);
      const ext = path.extname(fileName).toLowerCase();
      const contentType =
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".png" ? "image/png" :
        ext === ".webp" ? "image/webp" :
        ext === ".gif" ? "image/gif" :
        "application/octet-stream";
      return { data, contentType };
    } catch {
      return null;
    }
  }
  return null;
}
