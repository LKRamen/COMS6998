// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { auth, rpc, admin, getMoment, generate } = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn(), admin: vi.fn(), getMoment: vi.fn(), generate: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireCompleteProfile: auth }));
vi.mock("../../lib/supabase/admin", () => ({ createAdminClient: admin }));
vi.mock("../../lib/captions", () => ({ getMoment, retryPhotoCleanup: vi.fn() }));
vi.mock("../../lib/ai/gemini", () => ({ generateCaptions: generate, geminiConfig: () => ({ model: "test" }), generationSettings: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { castVote, generateBatch } from "./actions";
import { GenerationError } from "../../lib/generation-error";
const id = "00000000-0000-4000-8000-000000000001";
describe("caption mutations", () => {
 beforeEach(() => { vi.resetAllMocks(); auth.mockResolvedValue({ user: { id: "session-user" }, supabase: { rpc } }); rpc.mockResolvedValue({ data: { vote: 1, score: 1 }, error: null }); });
 it("uses a session client for desired-state voting, never an admin client", async () => {
  expect(await castVote(id,1)).toEqual({ ok: true, vote: 1, score: 1 });
  expect(rpc).toHaveBeenCalledWith("caption_vote", { p_caption_id: id, p_value: 1 }); expect(admin).not.toHaveBeenCalled();
 });
 it("does not mutate when authentication fails", async () => {
  auth.mockRejectedValue(new Error("redirect:/login"));
  await expect(castVote(id,1)).rejects.toThrow("redirect:/login"); expect(rpc).not.toHaveBeenCalled();
 });
 it("rejects a malformed identifier before a database call", async () => {
  const result = await castVote("victim",1); expect(result.ok).toBe(false); expect(rpc).not.toHaveBeenCalled();
 });
 it("does not spend another provider request on a successfully saved replay", async () => {
  getMoment.mockResolvedValue({ status: "draft", context: "", location: "", style: "Funny", photo_revision: "revision", captions: [], runs: [] });
  const adminRpc = vi.fn().mockResolvedValue({ data: { reused: true, state: "succeeded" }, error: null });
  admin.mockReturnValue({ rpc: adminRpc });
  expect(await generateBatch(id,id)).toMatchObject({ ok: true });
  expect(generate).not.toHaveBeenCalled();
  expect(adminRpc.mock.calls[0][1]).toMatchObject({ p_user_id: "session-user" });
 });
 it("releases the reservation when generation fails without creating a batch", async () => {
  getMoment.mockResolvedValue({ status: "draft", context: "", location: "", style: "Funny", photo_revision: "revision", photo_path: "photo", captions: [], runs: [] });
  const download = vi.fn().mockResolvedValue({ data: new Blob(["photo"]), error: null });
  auth.mockResolvedValue({ user: { id: "session-user" }, supabase: { rpc, storage: { from: () => ({ download }) } } });
  const adminRpc = vi.fn().mockResolvedValue({ data: { reused: false, id: "request" }, error: null });
  const snapshot = { state: "pending", photo_path: "session-user/photo", system_prompt: "stored system", user_prompt: "stored user" };
  const query = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: snapshot, error: null }) }; query.select.mockReturnValue(query); query.update.mockReturnValue(query); query.eq.mockReturnValue(query);
  admin.mockReturnValue({ rpc: adminRpc, from: () => query, storage: { from: () => ({ download }) } }); generate.mockRejectedValue(new GenerationError("Provider timed out."));
  expect(await generateBatch(id,id)).toEqual({ ok: false, error: "Provider timed out." });
  expect(download).toHaveBeenCalledWith("session-user/photo");
  expect(generate).toHaveBeenCalledWith(expect.objectContaining({ systemPrompt: "stored system", userPrompt: "stored user" }));
  expect(query.update).toHaveBeenCalledWith({ state: "failed", error_message: "Provider timed out." });
  expect(query.eq).toHaveBeenCalledWith("id", "request"); expect(query.eq).toHaveBeenCalledWith("creator_id", "session-user"); expect(query.eq).toHaveBeenCalledWith("state", "pending");
  expect(adminRpc.mock.calls.some(call => call[0] === "caption_finish")).toBe(false);
 });
 it("includes only this photo's previous captions in the regeneration prompt", async () => {
  getMoment.mockResolvedValue({ status: "draft", context: "", location: "", style: "Funny", photo_revision: "current", captions: [{ text: "Current photo", generation_run_id: "new" }, { text: "Replaced photo", generation_run_id: "old" }], runs: [{ id: "new", photo_revision: "current" }, { id: "old", photo_revision: "old" }] });
  const adminRpc = vi.fn().mockResolvedValue({ data: { reused: true, state: "succeeded" }, error: null });
  admin.mockReturnValue({ rpc: adminRpc });
  await generateBatch(id,id);
  expect(JSON.parse(adminRpc.mock.calls[0][1].p_user_prompt).previousCaptions).toEqual(["Current photo"]);
 });
});
