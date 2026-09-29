import sharp from "sharp";
import { deleteStorageObject, downloadStorageObject, uploadStorageObject } from "@/lib/supabase-admin";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 8 * 1024 * 1024;
export const MAX_PARTICIPANT_IMAGE_SIZE = 5 * 1024 * 1024;

export const STORAGE_BUCKETS = {
  passport: process.env.SUPABASE_PASSPORT_BUCKET || "passport-images",
  images: process.env.SUPABASE_IMAGES_BUCKET || "images",
  payment: process.env.SUPABASE_PAYMENT_BUCKET || "payment-screenshots",
} as const;

export class UploadError extends Error {
  statusCode = 400;
  constructor(message: string) { super(message); this.name = "UploadError"; }
}

export interface StoredFile {
  relativePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  isPrivate: boolean;
}

const extension = (mime: string) => mime === "image/jpeg" ? "jpg" : mime.split("/")[1];

export function detectImageMime(head: Uint8Array): string | null {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "image/png";
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) return "image/webp";
  return null;
}

export async function validateImageFile(file: File, options: { maxSize?: number } = {}): Promise<string> {
  if (!file?.size) throw new UploadError("The selected image is empty.");
  if (file.size > (options.maxSize ?? MAX_SIZE)) throw new UploadError("The selected image is too large.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectImageMime(bytes.subarray(0, 12));
  if (!detected || !IMAGE_MIME.has(detected) || file.type !== detected) throw new UploadError("File content is not a supported JPEG, PNG, or WebP image.");
  try {
    const metadata = await sharp(bytes, { failOn: "error", limitInputPixels: 12_000_000 }).metadata();
    const expected = detected === "image/jpeg" ? "jpeg" : detected.slice(6);
    if (!metadata.width || !metadata.height || metadata.format !== expected) throw new Error("bad image");
    await sharp(bytes, { failOn: "error", limitInputPixels: 12_000_000 }).stats();
  } catch { throw new UploadError("The selected image is malformed or cannot be decoded."); }
  return detected;
}

function parseObjectReference(reference: string): { bucket: string; path: string } | null {
  const match = /^supabase:\/\/([a-z0-9-]+)\/([a-z0-9/_-]+\.(?:jpg|png|webp))$/.exec(reference);
  if (!match || match[2].includes("..")) return null;
  return { bucket: match[1], path: match[2] };
}

export function isManagedStoragePath(reference: string): boolean { return parseObjectReference(reference) !== null; }

async function store(file: File, bucket: string, folder: string, maxSize = MAX_SIZE): Promise<StoredFile> {
  const mimeType = await validateImageFile(file, { maxSize });
  const fileName = `${crypto.randomUUID()}.${extension(mimeType)}`;
  const objectPath = `${folder}/${fileName}`;
  await uploadStorageObject(bucket, objectPath, Buffer.from(await file.arrayBuffer()), mimeType);
  return { relativePath: `supabase://${bucket}/${objectPath}`, fileName, mimeType, sizeBytes: file.size, isPrivate: true };
}

export const storeParticipantImage = (file: File) => store(file, STORAGE_BUCKETS.passport, "participants", MAX_PARTICIPANT_IMAGE_SIZE);
export const storePaymentScreenshot = ({ file, paymentId }: { file: File; paymentId: string }) => store(file, STORAGE_BUCKETS.payment, `payments/${paymentId}`);
export const storeImage = ({ file }: { file: File; prefix: string }) => store(file, STORAGE_BUCKETS.images, "uploads");

export async function deletePrivateFile(reference: string): Promise<void> {
  const object = parseObjectReference(reference);
  if (!object) return;
  await deleteStorageObject(object.bucket, object.path);
}

export async function readPrivateFile(reference: string): Promise<{ data: Buffer; contentType: string } | null> {
  const object = parseObjectReference(reference);
  if (!object || ![STORAGE_BUCKETS.passport, STORAGE_BUCKETS.payment].includes(object.bucket as never)) return null;
  const bytes = await downloadStorageObject(object.bucket, object.path);
  if (!bytes) return null;
  const contentType = detectImageMime(bytes.subarray(0, 12));
  return contentType ? { data: bytes, contentType } : null;
}
