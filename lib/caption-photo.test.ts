// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import sharp from "sharp";
import { normalizePhoto } from "./caption-photo";
describe("photo normalization", () => {
  it("decodes, strips metadata and resizes a real image", async () => {
    const input = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "green" } }).jpeg().withMetadata().toBuffer();
    const output = await normalizePhoto(new File([input], "photo.jpg", { type: "image/jpeg" }));
    const info = await sharp(output).metadata();
    expect(info.width).toBe(1600); expect(info.height).toBe(800); expect(info.exif).toBeUndefined();
  });
  it("rejects mislabeled, unsupported and oversized files", async () => {
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
    await expect(normalizePhoto(new File([png], "lie.jpg", { type: "image/jpeg" }))).rejects.toThrow();
    await expect(normalizePhoto(new File(["junk"], "file.gif", { type: "image/gif" }))).rejects.toThrow();
    await expect(normalizePhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }))).rejects.toThrow();
  });
});
