// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { client, profile, complete, prepare, jobs, after } = vi.hoisted(() => ({ client: vi.fn(), profile: vi.fn(), complete: vi.fn(), prepare: vi.fn(), jobs: vi.fn(), after: vi.fn() }));
vi.mock("../../../lib/supabase/server", () => ({ createClient: client }));
vi.mock("../../../lib/auth", () => ({ readProfile: profile, isProfileComplete: complete }));
vi.mock("../../../lib/generation-jobs", () => ({ prepareGeneration: prepare, getGenerationJobs: jobs }));
vi.mock("next/server", async importOriginal => ({ ...await importOriginal<typeof import("next/server")>(), after }));
import { GET, POST } from "./route";
const id = "00000000-0000-4000-8000-000000000001";
const session = { auth: { getUser: vi.fn() } };
function request(body: unknown = { momentId: id, requestKey: id }) { return new Request("https://brainrot.example/api/generations", { method: "POST", headers: { origin: "https://brainrot.example", "content-type": "application/json" }, body: JSON.stringify(body) }); }
describe("persistent background generation API", () => {
 beforeEach(() => { vi.resetAllMocks(); client.mockResolvedValue(session); session.auth.getUser.mockResolvedValue({ data: { user: { id: "actual-session-user" } } }); complete.mockReturnValue(true); profile.mockResolvedValue({}); jobs.mockResolvedValue([]); });
 it("persists the reservation before acknowledging, then performs work after response", async () => {
  const perform = vi.fn().mockResolvedValue({ ok: true });
  prepare.mockResolvedValue({ reservation: { id, reused: false, state: "pending" }, perform });
  const response = await POST(request({ momentId: id, requestKey: id, userId: "impersonated" }));
  expect(response.status).toBe(202);
  expect(prepare).toHaveBeenCalledWith(session, "actual-session-user", id, id);
  expect(perform).not.toHaveBeenCalled(); expect(after).toHaveBeenCalledOnce();
  await after.mock.calls[0][0](); expect(perform).toHaveBeenCalledOnce();
 });
 it("never schedules another provider request for an already reserved request key", async () => {
  prepare.mockResolvedValue({ reservation: { id, reused: true, state: "pending" }, perform: vi.fn() });
  expect((await POST(request())).status).toBe(202); expect(after).not.toHaveBeenCalled();
 });
 it("rejects anonymous, incomplete-profile and cross-origin creation before reserving", async () => {
  const cross = new Request("https://brainrot.example/api/generations", { method: "POST", headers: { origin: "https://other.example" }, body: "{}" });
  expect((await POST(cross)).status).toBe(403);
  session.auth.getUser.mockResolvedValueOnce({ data: { user: null } }); expect((await POST(request())).status).toBe(401);
  complete.mockReturnValue(false); expect((await POST(request())).status).toBe(403);
  expect(prepare).not.toHaveBeenCalled(); expect(after).not.toHaveBeenCalled();
 });
 it("loads only the current session's statuses with no shared caching", async () => {
  const response = await GET(); expect(jobs).toHaveBeenCalledWith("actual-session-user");
  expect(response.headers.get("cache-control")).toContain("no-store"); expect(await response.json()).toEqual({ jobs: [] });
  session.auth.getUser.mockResolvedValue({ data: { user: null } }); jobs.mockClear();
  expect((await GET()).status).toBe(401); expect(jobs).not.toHaveBeenCalled();
 });
});
