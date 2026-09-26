import path from "node:path";
import { promises as fs } from "node:fs";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), ".private-uploads");
const ALLOWED_MIME: ReadonlySet<string> = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_PASSPORT_SIZE = 50 * 1024;
const ALLOWED_BUCKETS = new Set(["passport-images", "payment-screenshots", "images"]);

type AllowedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function isAllowedImageMime(value: string): value is AllowedImageMime {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp" || value === "image/gif";
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}

function supabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export class UploadError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export interface StoredFile {
  bucket: string;
  objectPath: string;
  relativePath: string;
  absolutePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isPrivate: boolean;
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

function detectImageMime(head: Uint8Array): AllowedImageMime | null {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return "image/png";
  }
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) {
    return "image/gif";
  }
  if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function isSafeStoragePath(value: string): boolean {
  if (!value || value.startsWith("/") || value.includes("..") || value.includes("\\")) {
    return false;
  }
  return value.split("/").every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

function safeName(prefix: string, mime: string): string {
  const ext = guessExtension(mime);
  const random = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `${prefix}-${random}.${ext}`;
}

async function validateImageUpload(file: File, maxBytes: number, label: string): Promise<AllowedImageMime> {
  if (!file) throw new UploadError(`No ${label} file provided`);
  if (!isAllowedImageMime(file.type) || !ALLOWED_MIME.has(file.type)) {
    throw new UploadError(`Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`);
  }
  if (file.size > maxBytes) {
    throw new UploadError(`${label} image must be ${Math.floor(maxBytes / 1024)} KB or smaller`);
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = detectImageMime(head);
  if (!detected || !isAllowedImageMime(detected) || !ALLOWED_MIME.has(detected)) {
    throw new UploadError(`${label} file content is not a valid image`);
  }
  return detected;
}

async function uploadToSupabase(bucket: string, objectPath: string, file: File, mimeType: string): Promise<StoredFile> {
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  if (!supabaseAdmin || !supabaseStorageConfigured()) {
    throw new UploadError("Supabase Storage is not configured for this deployment");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage.from(bucket).upload(objectPath, buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    throw new UploadError(`Failed to store file in ${bucket}: ${error.message}`);
  }
  return {
    bucket,
    objectPath,
    relativePath: `supabase://${bucket}/${objectPath}`,
    absolutePath: `supabase://${bucket}/${objectPath}`,
    fileName: path.basename(objectPath),
    mimeType,
    sizeBytes: file.size,
    isPrivate: true,
  };
}

async function saveToLocal(file: File, bucket: string, objectPath: string, mimeType: string): Promise<StoredFile> {
  const root = bucket === "passport-images" || bucket === "payment-screenshots" ? PRIVATE_UPLOAD_ROOT : UPLOAD_ROOT;
  await fs.mkdir(root, { recursive: true });
  const abs = path.join(root, objectPath.replace(/\//g, path.sep));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(await file.arrayBuffer()));

  return {
    bucket,
    objectPath,
    relativePath: bucket === "passport-images" || bucket === "payment-screenshots" ? `private://${bucket}/${objectPath}` : `/uploads/${objectPath}`,
    absolutePath: abs,
    fileName: path.basename(objectPath),
    mimeType,
    sizeBytes: file.size,
    isPrivate: bucket === "passport-images" || bucket === "payment-screenshots",
  };
}

async function storeInBucket(bucket: string, file: File, prefix: string, maxBytes: number): Promise<StoredFile> {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new UploadError(`Unsupported storage bucket: ${bucket}`);
  }
  const detectedType = await validateImageUpload(file, maxBytes, bucket === "passport-images" ? "Passport" : bucket === "payment-screenshots" ? "Payment screenshot" : "Image");
  const objectPath = `${prefix}/${safeName("upload", detectedType)}`;
  if (!isSafeStoragePath(objectPath)) {
    throw new UploadError("Invalid generated storage path");
  }

  if (isVercelRuntime() && !supabaseStorageConfigured()) {
    throw new UploadError(`Production upload requires Supabase Storage configuration for ${bucket}. Set SUPABASE_URL and SUPABASE_SECRET_KEY.`);
  }

  if (supabaseStorageConfigured()) {
    try {
      return await uploadToSupabase(bucket, objectPath, file, detectedType);
    } catch {
      if (isVercelRuntime()) {
        throw new UploadError(`Storage upload failed for ${bucket}. Check Supabase configuration.`);
      }
    }
  }

  if (isVercelRuntime()) {
    throw new UploadError(`Production upload requires Supabase Storage for ${bucket}.`);
  }

  return saveToLocal(file, bucket, objectPath, detectedType);
}

export async function storePassportImage(opts: {
  file: File;
  participantId?: string;
  prefix?: string;
}): Promise<StoredFile> {
  const { file, participantId = "participant", prefix = "passports" } = opts;
  const safePrefix = participantId ? `${prefix}/${participantId}` : prefix;
  return storeInBucket("passport-images", file, safePrefix, MAX_PASSPORT_SIZE);
}

export async function storePaymentScreenshot(opts: {
  file: File;
  paymentId: string;
}): Promise<StoredFile> {
  const { file, paymentId } = opts;
  return storeInBucket("payment-screenshots", file, `payments/${paymentId}`, MAX_IMAGE_SIZE);
}

export async function storeEventImage(opts: {
  file: File;
  prefix?: string;
}): Promise<StoredFile> {
  const { file, prefix = "general" } = opts;
  return storeInBucket("images", file, prefix, MAX_IMAGE_SIZE);
}

export async function storeImage(opts: {
  file: File;
  prefix: string;
}): Promise<StoredFile> {
  const { file, prefix } = opts;
  return storeInBucket("images", file, prefix, MAX_IMAGE_SIZE);
}

export async function deleteStorageObject(bucket: string, objectPath: string): Promise<void> {
  if (!ALLOWED_BUCKETS.has(bucket) || !isSafeStoragePath(objectPath)) {
    throw new UploadError("Invalid storage deletion request");
  }
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  if (supabaseAdmin && supabaseStorageConfigured()) {
    await supabaseAdmin.storage.from(bucket).remove([objectPath]);
    return;
  }
  const fullPath = bucket === "passport-images" || bucket === "payment-screenshots"
    ? path.join(PRIVATE_UPLOAD_ROOT, objectPath.replace(/\//g, path.sep))
    : path.join(UPLOAD_ROOT, objectPath.replace(/\//g, path.sep));
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore missing local files during cleanup
  }
}

export async function deletePassportImage(filePath: string): Promise<void> {
  if (!filePath) return;
  if (filePath.startsWith("supabase://passport-images/")) {
    const objectPath = filePath.replace("supabase://passport-images/", "");
    await deleteStorageObject("passport-images", objectPath);
    return;
  }
  if (filePath.startsWith("private://passport-images/")) {
    const objectPath = filePath.replace("private://passport-images/", "");
    await deleteStorageObject("passport-images", objectPath);
  }
}

export async function getPrivateSupabaseStream(filePath: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const prefix = "supabase://";
  if (!filePath.startsWith(prefix) || !supabaseStorageConfigured()) {
    return null;
  }
  const separator = filePath.indexOf("/");
  if (separator === -1) return null;
  const bucket = filePath.slice("supabase://".length, separator);
  const objectPath = filePath.slice("supabase://".length + bucket.length + 1);
  if (!ALLOWED_BUCKETS.has(bucket) || !isSafeStoragePath(objectPath)) {
    return null;
  }
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(objectPath);
    if (error || !data) return null;
    return {
      stream: data.stream() as ReadableStream<Uint8Array>,
      contentType: data.type || "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function createSignedImageUrl(bucket: string, objectPath: string, expiresIn = 60): Promise<string | null> {
  if (!ALLOWED_BUCKETS.has(bucket) || !isSafeStoragePath(objectPath)) {
    return null;
  }
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  if (!supabaseAdmin || !supabaseStorageConfigured()) return null;
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Read a private stored file from the local dev filesystem.
 */
export async function readLocalPrivateFile(relativePath: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!relativePath.startsWith("private://")) {
    return null;
  }

  const normalized = relativePath.replace("private://", "");
  const [, bucket, ...rest] = normalized.split("/");
  if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
    return null;
  }
  const objectPath = rest.join("/");
  if (!isSafeStoragePath(objectPath)) {
    return null;
  }

  const abs = path.join(bucket === "passport-images" || bucket === "payment-screenshots" ? PRIVATE_UPLOAD_ROOT : UPLOAD_ROOT, objectPath.replace(/\//g, path.sep));

  try {
    const data = await fs.readFile(abs);
    const ext = path.extname(objectPath).toLowerCase();
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
