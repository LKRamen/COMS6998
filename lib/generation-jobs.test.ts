// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { admin } = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock("./supabase/admin", () => ({ createAdminClient: admin }));
vi.mock("./captions", () => ({ getMoment: vi.fn() }));
vi.mock("./ai/gemini", () => ({ generateCaptions: vi.fn(), geminiConfig: vi.fn(), generationSettings: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { getGenerationJobs } from "./generation-jobs";
const base = { id: "job", moment_id: "draft", photo_revision: "current", state: "succeeded", run_id: "run", created_at: "2026-10-15T12:00:00Z", lease_expires_at: "2026-10-15T12:05:00Z" };
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
