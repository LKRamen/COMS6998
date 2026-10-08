// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { generateCaptions } from "./gemini";
describe("Gemini captions", () => {
 afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
 it("requires server configuration", async () => {
  vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GEMINI_MODEL", "");
  await expect(generateCaptions({ image: Buffer.from("image"), systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("not configured");
 });
 it("requests image understanding and validates the returned text", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-key"); vi.stubEnv("GEMINI_MODEL", "test-model");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ captions: ["One", "Two", "Three"] }) }] } }] }));
  vi.stubGlobal("fetch", fetcher);
  expect(await generateCaptions({ image: Buffer.from("image"), systemPrompt: "s", userPrompt: "u" })).toEqual(["One", "Two", "Three"]);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body.contents[0].parts[1].inlineData.mimeType).toBe("image/jpeg");
  expect(fetcher.mock.calls[0][0]).not.toContain("test-key");
 });
 it("handles quota and safety blocks without passing raw provider messages", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test"); vi.stubEnv("GEMINI_MODEL", "test-model");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider message", { status: 429 })));
  await expect(generateCaptions({ image: Buffer.from("i"), systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("temporarily at its limit");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ promptFeedback: { blockReason: "SAFETY" } })));
  await expect(generateCaptions({ image: Buffer.from("i"), systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("could not generate");
 });
});
