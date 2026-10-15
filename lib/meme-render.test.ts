import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import sharp from "sharp";
import { renderMeme } from "./meme-render";
describe("shareable meme rendering", () => {
 it("grows the text band for wide Unicode and long unbroken captions", async () => {
  const image = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ff7464" } }).jpeg().toBuffer();
  const short = await sharp(await renderMeme(image, "short")).metadata();
  for (const text of ["界".repeat(36), "Ａ".repeat(36), "W".repeat(200)]) {
   const long = await sharp(await renderMeme(image, text)).metadata();
   expect(long.width).toBe(1080); expect(long.height).toBeGreaterThan(short.height! + 30);
  }
 });
 it("renders image plus readable text without interpreting markup", async () => {
  const image = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ff7464" } }).jpeg().toBuffer();
  const result = await renderMeme(image, '<script>& "still a caption"');
  const meta = await sharp(result).metadata();
  expect(meta.format).toBe("jpeg"); expect(meta.width).toBe(1080); expect(meta.height).toBeGreaterThan(720);
 });
 it("rejects blank and overlong text", async () => {
  await expect(renderMeme(Buffer.alloc(0), " ")).rejects.toThrow("1–240");
  await expect(renderMeme(Buffer.alloc(0), "x".repeat(241))).rejects.toThrow("1–240");
 });
});
