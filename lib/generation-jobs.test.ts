// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { admin, getMoment, config, generate, pipelinePicker, runPipeline } = vi.hoisted(() => ({ admin: vi.fn(), getMoment: vi.fn(), config: vi.fn(), generate: vi.fn(), pipelinePicker: vi.fn(), runPipeline: vi.fn() }));
vi.mock("./supabase/admin", () => ({ createAdminClient: admin }));
vi.mock("./captions", () => ({ getMoment }));
vi.mock("./ai/gemini", () => ({ generateCaptions: generate, geminiConfig: config, generationSettings: () => ({ temperature: 0.9 }) }));
vi.mock("./pipeline-runtime", () => ({ runPipeline }));
vi.mock("./published-pipeline", () => ({ getPublishedPipeline: pipelinePicker, readPipelineSnapshot: (value: unknown) => value }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { getGenerationJobs, prepareGeneration } from "./generation-jobs";
const base = { error_message: null, id: "job", moment_id: "draft", photo_revision: "current", state: "succeeded", run_id: "run", created_at: "2026-10-15T12:00:00Z", lease_expires_at: "2026-10-15T12:05:00Z" };
beforeEach(() => { vi.resetAllMocks(); pipelinePicker.mockResolvedValue(null); });
it("returns only this session's current-photo draft statuses and strips internal metadata", async () => {
 const rows = [
  { ...base, moment: { status: "draft", photo_revision: "current" }, system_prompt: "must not escape" },
  { ...base, id: "published", moment: { status: "published", photo_revision: "current" } },
  { ...base, id: "replaced", photo_revision: "old", moment: { status: "draft", photo_revision: "current" } },
  { ...base, id: "deleted", moment: null },
 ];
 const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: rows, error: null }) };
 query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query);
 admin.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
 expect(await getGenerationJobs("session-owner")).toEqual([base]);
 expect(query.eq).toHaveBeenCalledWith("creator_id", "session-owner");
 expect(query.eq).toHaveBeenCalledWith("moment.status", "draft");
});
it("exposes a timed-out lease as recoverable expiry instead of an endless pending state", async () => {
 const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: [{ ...base, state: "pending", lease_expires_at: "2000-01-01T00:00:00Z", moment: { status: "draft", photo_revision: "current" } }], error: null }) };
 query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); admin.mockReturnValue({ from: () => query });
 expect((await getGenerationJobs("session-owner"))[0].state).toBe("expired");
});
it("never stores arbitrary internal exception details as a user-facing failure", async () => {
 const id = "00000000-0000-4000-8000-000000000001";
 config.mockReturnValue({ model: "test-model" });
 getMoment.mockResolvedValue({ status: "draft", context: "", style: "Brainrot", photo_revision: id, captions: [], runs: [] });
 const query = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), single: vi.fn().mockRejectedValue(new Error("private internal provider body: secret")) };
 query.select.mockReturnValue(query); query.update.mockReturnValue(query); query.eq.mockReturnValue(query);
 admin.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: { id, reused: false, state: "pending" }, error: null }), from: () => query });
 const prepared = await prepareGeneration({} as Parameters<typeof prepareGeneration>[0], "session-owner", id, id);
 expect(await prepared.perform()).toEqual({ ok: false, error: "Generation failed. Your draft is saved; try again." });
 expect(query.update).toHaveBeenCalledWith({ state: "failed", error_message: "Generation failed. Your draft is saved; try again." });
 expect(query.eq).toHaveBeenCalledWith("creator_id", "session-owner"); expect(query.eq).toHaveBeenCalledWith("state", "pending");
});

const id = "00000000-0000-4000-8000-000000000001";
const release = { id, pipeline_id: id, draft_version: 2, name: "Published", description: "", style: "Brainrot", steps: [{ name: "Caption", model: "gemini-2.5-flash", systemPrompt: "Test rules", userPrompt: "{{context}}" }] };
function generationFixture(existing: Record<string, unknown> | null = null, reused = false) {
 config.mockReturnValue({ model: "gemini-default" });
 getMoment.mockResolvedValue({ status: "draft", context: "a test image", style: "Brainrot", photo_revision: id, captions: [], runs: [] });
 const snapshot: Record<string, unknown> = { state: "pending", photo_path: `session-owner/${id}/photo.jpg` };
 const query = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { id }, error: null }), single: vi.fn().mockImplementation(async () => ({ data: snapshot, error: null })) };
 query.maybeSingle.mockResolvedValueOnce({ data: existing, error: null });
 query.select.mockReturnValue(query); query.update.mockReturnValue(query); query.eq.mockReturnValue(query);
 const rpc = vi.fn().mockImplementation(async (name: string, args: Record<string, unknown>) => {
  if (name === "caption_reserve") {
   Object.assign(snapshot, { settings: args.p_settings, system_prompt: args.p_system_prompt, user_prompt: args.p_user_prompt });
   return { data: { id, reused, state: reused ? "succeeded" : "pending" }, error: null };
  }
  return { data: id, error: null };
 });
 const db = { rpc, from: vi.fn().mockReturnValue(query), storage: { from: vi.fn().mockReturnValue({ download: vi.fn().mockResolvedValue({ data: new Blob(["image"]), error: null }) }) } };
 admin.mockReturnValue(db);
 generate.mockResolvedValue(["Built in one", "Built in two", "Built in three"]);
 runPipeline.mockResolvedValue({ steps: [{ name: "Caption", model: "gemini-2.5-flash", systemPrompt: "Executed rules", userPrompt: "Executed prompt", output: "output" }], captions: ["One", "Two", "Three"] });
 return { db, query, rpc, snapshot };
}
it("keeps built-in generation when the style has no active release", async () => {
 const { rpc } = generationFixture();
 const prepared = await prepareGeneration({} as never, "session-owner", id, id);
 expect(await prepared.perform()).toEqual({ ok: true });
 expect(generate).toHaveBeenCalledOnce();
 expect(runPipeline).not.toHaveBeenCalled();
 expect(rpc.mock.calls[0][1].p_settings).toEqual({ temperature: 0.9 });
});
it("runs the reserved release without rereading publication and persists its exact trace before completion", async () => {
 const { rpc, query } = generationFixture();
 pipelinePicker.mockResolvedValue(release);
 const prepared = await prepareGeneration({} as never, "session-owner", id, id);
 pipelinePicker.mockResolvedValue({ ...release, id: "a-new-release" });
 expect(await prepared.perform()).toEqual({ ok: true });
 expect(pipelinePicker).toHaveBeenCalledOnce();
 expect(runPipeline).toHaveBeenCalledWith(expect.objectContaining({ steps: release.steps, context: "a test image", style: "Brainrot", previousCaptions: [] }));
 expect(generate).not.toHaveBeenCalled();
 expect(rpc.mock.calls[0][1]).toMatchObject({ p_model: "gemini-2.5-flash", p_settings: { pipeline: release, pipelineInput: { context: "a test image", style: "Brainrot" } } });
 expect(query.update).toHaveBeenCalledWith({ settings: expect.objectContaining({ pipelineTrace: expect.arrayContaining([expect.objectContaining({ systemPrompt: "Executed rules", userPrompt: "Executed prompt" })]) }) });
 expect(query.update.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[1]);
 expect(rpc).toHaveBeenLastCalledWith("caption_finish", { p_user_id: "session-owner", p_request_id: id, p_captions: ["One", "Two", "Three"] });
});
it("reuses the original release and ignores saved trace when retrying a completed request key", async () => {
 const stored = { settings: { pipeline: release, pipelineTrace: [{ output: "old" }], pipelineInput: { context: "a test image", style: "Brainrot" } }, model: "gemini-2.5-flash", system_prompt: "Original snapshot" };
 const { rpc } = generationFixture(stored, true);
 const prepared = await prepareGeneration({} as never, "session-owner", id, id);
 expect(await prepared.perform()).toEqual({ ok: true });
 expect(pipelinePicker).not.toHaveBeenCalled();
 expect(runPipeline).not.toHaveBeenCalled();
 expect(rpc.mock.calls[0][1].p_settings.pipeline).toEqual(release);
 expect(rpc.mock.calls[0][1].p_settings).not.toHaveProperty("pipelineTrace");
 expect(rpc.mock.calls[0][1].p_system_prompt).toBe("Original snapshot");
});
it("does not complete a generation if the execution trace cannot be saved", async () => {
 const { query, rpc } = generationFixture();
 pipelinePicker.mockResolvedValue(release);
 query.maybeSingle.mockResolvedValue({ data: null, error: { message: "internal failure" } });
 const prepared = await prepareGeneration({} as never, "session-owner", id, id);
 expect(await prepared.perform()).toEqual({ ok: false, error: "The pipeline results could not be saved. Your draft is saved; try again." });
 expect(rpc).not.toHaveBeenCalledWith("caption_finish", expect.anything());
 expect(query.update).toHaveBeenLastCalledWith({ state: "failed", error_message: "The pipeline results could not be saved. Your draft is saved; try again." });
});
