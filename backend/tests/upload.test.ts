import { describe, expect, it } from "bun:test";
import sharp from "sharp";
import { MAX_PARTICIPANT_IMAGE_SIZE, UploadError, detectImageMime, isManagedStoragePath, validateImageFile } from "@/lib/upload";

const make = async (format: "jpeg" | "png" | "webp") => sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })[format]().toBuffer();

describe("image upload validation", () => {
  for (const [mime, format] of [["image/jpeg", "jpeg"], ["image/png", "png"], ["image/webp", "webp"]] as const) {
    it(`accepts decoded ${mime}`, async () => expect(await validateImageFile(new File([await make(format)], "image", { type: mime }))).toBe(mime));
  }
  it("rejects spoofed, malformed, empty, and oversized uploads", async () => {
    await expect(validateImageFile(new File(["not png"], "x.png", { type: "image/png" }))).rejects.toBeInstanceOf(UploadError);
    await expect(validateImageFile(new File([], "x.png", { type: "image/png" }))).rejects.toThrow("empty");
    await expect(validateImageFile(new File([new Uint8Array(MAX_PARTICIPANT_IMAGE_SIZE + 1)], "x.png", { type: "image/png" }), { maxSize: MAX_PARTICIPANT_IMAGE_SIZE })).rejects.toThrow("large");
  });
  it("uses content magic rather than filenames", () => expect(detectImageMime(new Uint8Array([1, 2, 3]))).toBeNull());
  it("only recognizes safe opaque storage references", () => {
    expect(isManagedStoragePath("supabase://passport-images/participants/id.jpg")).toBe(true);
    expect(isManagedStoragePath("supabase://passport-images/../../secret.jpg")).toBe(false);
    expect(isManagedStoragePath("https://example.test/object.jpg")).toBe(false);
  });
});
