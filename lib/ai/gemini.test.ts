// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { generateCaptions, generationSettings } from "./gemini";
describe("Gemini captions", () => {
 afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
 it("requires server configuration", async () => {
  vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GEMINI_MODEL", "");
  await expect(generateCaptions({ image: Buffer.from("image"), systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("not configured");
 });
 it("uses low reasoning for Gemini 3 without unsupported settings on older models", () => {
  expect(generationSettings("gemini-3.8-flash")).toMatchObject({ thinkingConfig: { thinkingLevel: "low" }, maxOutputTokens: 4096 });
  expect(generationSettings("gemini-2.5-flash")).not.toHaveProperty("thinkingConfig");
 });
 it("sanitizes malformed provider response bodies", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test"); vi.stubEnv("GEMINI_MODEL", "gemini-3.8-flash");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider body", { status: 200 })));
  await expect(generateCaptions({ image: Buffer.from("i"), systemPrompt: "s", userPrompt: "u" })).rejects.toThrow("valid response");
 });
 it("requests image understanding and validates the returned text", async () => {
  vi.stubEnv("GEMINI_API_KEY", "test-key"); vi.stubEnv("GEMINI_MODEL", "test-model");
  const fetcher = vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ captions: ["One", "Two", "Three"] }) }] } }] }));
  vi.stubGlobal("fetch", fetcher);
  expect(await generateCaptions({ image: Buffer.from("image"), systemPrompt: "s", userPrompt: "u" })).toEqual(["One", "Two", "Three"]);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: "image/jpeg", data: Buffer.from("image").toString("base64") });
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
