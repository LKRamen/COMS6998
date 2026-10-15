// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { admin, getMoment, config } = vi.hoisted(() => ({ admin: vi.fn(), getMoment: vi.fn(), config: vi.fn() }));
vi.mock("./supabase/admin", () => ({ createAdminClient: admin }));
vi.mock("./captions", () => ({ getMoment }));
vi.mock("./ai/gemini", () => ({ generateCaptions: vi.fn(), geminiConfig: config, generationSettings: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { getGenerationJobs, prepareGeneration } from "./generation-jobs";
const base = { error_message: null, id: "job", moment_id: "draft", photo_revision: "current", state: "succeeded", run_id: "run", created_at: "2026-10-15T12:00:00Z", lease_expires_at: "2026-10-15T12:05:00Z" };
beforeEach(() => vi.resetAllMocks());
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
 const query = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), single: vi.fn().mockRejectedValue(new Error("private internal provider body: secret")) };
 query.select.mockReturnValue(query); query.update.mockReturnValue(query); query.eq.mockReturnValue(query);
 admin.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: { id, reused: false, state: "pending" }, error: null }), from: () => query });
 const prepared = await prepareGeneration({} as Parameters<typeof prepareGeneration>[0], "session-owner", id, id);
 expect(await prepared.perform()).toEqual({ ok: false, error: "Generation failed. Your draft is saved; try again." });
 expect(query.update).toHaveBeenCalledWith({ state: "failed", error_message: "Generation failed. Your draft is saved; try again." });
 expect(query.eq).toHaveBeenCalledWith("creator_id", "session-owner"); expect(query.eq).toHaveBeenCalledWith("state", "pending");
});
