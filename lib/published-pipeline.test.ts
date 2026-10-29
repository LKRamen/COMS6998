// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getPublishedPipeline, readPipelineSnapshot } from "./published-pipeline";

const release = {
  id: "00000000-0000-4000-8000-000000000001", pipeline_id: "00000000-0000-4000-8000-000000000002",
  draft_version: 2, name: "Dry wit", style: "Dry sarcasm",
  steps: [{ name: "Caption", model: "gemini-2.5-flash", systemPrompt: "Write captions.", userPrompt: "{{context}}" }],
};
function client(result: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  return { from: vi.fn().mockReturnValue(query), query };
}
it("returns the selected style's published snapshot and uses a fixed Gemini model", async () => {
  const db = client({ data: { release }, error: null });
  expect(await getPublishedPipeline(db as never, "Dry sarcasm")).toEqual({ ...release, description: "" });
  expect(db.query.eq).toHaveBeenCalledWith("style", "Dry sarcasm");
});
it("falls back only when no active release exists", async () => {
  expect(await getPublishedPipeline(client({ data: null, error: null }) as never, "Brainrot")).toBeNull();
  await expect(getPublishedPipeline(client({ data: null, error: { message: "secret" } }) as never, "Brainrot")).rejects.toThrow("Published pipeline could not be loaded");
});
it("rejects corrupt releases, unresolved model defaults and mismatched styles", () => {
  expect(() => readPipelineSnapshot({ ...release, style: "Brainrot" }, "Dry sarcasm")).toThrow();
  expect(() => readPipelineSnapshot({ ...release, steps: [{ ...release.steps[0], model: "default" }] }, "Dry sarcasm")).toThrow();
  expect(() => readPipelineSnapshot({ ...release, id: "not-a-release" }, "Dry sarcasm")).toThrow();
});
