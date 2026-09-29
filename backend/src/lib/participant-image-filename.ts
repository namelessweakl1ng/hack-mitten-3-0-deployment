const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function participantImageFilename(name: string, mimeType: string): string {
  const base = name.normalize("NFKC").replace(/[\\/\r\n\t";]+/g, " ").replace(/[^\p{L}\p{N} .'-]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^[. '-]+|[. '-]+$/g, "").slice(0, 80) || "Participant";
  return `${base}.${EXTENSIONS[mimeType] || "jpg"}`;
}
