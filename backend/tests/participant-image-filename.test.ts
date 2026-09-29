import { describe, expect, it } from "bun:test";
import { participantImageFilename } from "@/lib/participant-image-filename";

describe("participant image filenames", () => {
  it("uses the participant name and detected extension", () => expect(participantImageFilename("Pradeep Kadakol", "image/jpeg")).toBe("Pradeep Kadakol.jpg"));
  it("removes path and header metacharacters", () => expect(participantImageFilename('../../John\r\n" Doe', "image/png")).toBe("John Doe.png"));
  it("falls back for an unusable name", () => expect(participantImageFilename("///", "image/webp")).toBe("Participant.webp"));
});
