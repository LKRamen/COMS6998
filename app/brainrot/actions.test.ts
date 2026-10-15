import { beforeEach, expect, it, vi } from "vitest";
const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser }, rpc }) }));
vi.mock("../../lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("../../lib/captions", () => ({ getMoment: vi.fn() }));
vi.mock("../../lib/memes", () => ({ discover: vi.fn() }));
import { voteMeme, loadSwipeMemes } from "./actions";
beforeEach(() => { vi.resetAllMocks(); });
it("returns a clear expired-session response without writing a vote", async () => {
 getUser.mockResolvedValue({ data: { user: null } });
 expect(await voteMeme("30000000-0000-4000-8000-000000000001", 1)).toMatchObject({ ok: false, login: true });
 expect(rpc).not.toHaveBeenCalled();
});
it("uses server-derived identity and returns the authoritative vote score", async () => {
 getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
 rpc.mockResolvedValue({ data: { vote: -1, score: -4 }, error: null });
 expect(await voteMeme("30000000-0000-4000-8000-000000000001", -1)).toEqual({ ok: true, vote: -1, score: -4 });
 expect(rpc).toHaveBeenCalledWith("caption_vote", { p_caption_id: "30000000-0000-4000-8000-000000000001", p_value: -1 });
});
it("rejects invalid pagination exclusions before contacting the database", async () => {
 expect(await loadSwipeMemes(["invalid"])).toMatchObject({ ok: false }); expect(rpc).not.toHaveBeenCalled();
});
