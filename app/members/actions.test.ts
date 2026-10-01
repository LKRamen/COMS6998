// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { auth, insert, remove, eq } = vi.hoisted(() => ({ auth: vi.fn(), insert: vi.fn(), remove: vi.fn(), eq: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireCompleteProfile: auth }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { addVisit, removeVisit } from "./actions";
function form(code = "840") { const form = new FormData(); form.set("country_code", code); form.set("user_id", "victim"); return form; }
describe("travel mutations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.mockResolvedValue({ user: { id: "owner" }, supabase: { from: () => ({ insert, delete: remove }) } });
    insert.mockResolvedValue({ error: null });
    remove.mockReturnValue({ eq });
    eq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });
  it("derives the owner from authentication, never the submitted user ID", async () => {
    await expect(addVisit(form())).rejects.toThrow("redirect:/members?saved=1");
    expect(insert).toHaveBeenCalledWith({ user_id: "owner", country_code: "840" });
  });
  it("rejects unknown country codes before insertion", async () => {
    await expect(addVisit(form("INVALID"))).rejects.toThrow("redirect:/members?error=country");
    expect(insert).not.toHaveBeenCalled();
  });
  it("accepts duplicate visits without increasing counts", async () => {
    insert.mockResolvedValue({ error: { code: "23505" } });
    await expect(addVisit(form())).rejects.toThrow("redirect:/members?saved=1");
  });
  it("does not write when authentication fails", async () => {
    auth.mockRejectedValue(new Error("redirect:/login"));
    await expect(addVisit(form())).rejects.toThrow("redirect:/login");
    expect(insert).not.toHaveBeenCalled();
  });
  it("restricts removals to the authenticated owner", async () => {
    await expect(removeVisit(form())).rejects.toThrow("redirect:/members?removed=1");
    expect(eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("shows an error instead of success on a failed write", async () => {
    insert.mockResolvedValue({ error: { code: "42501" } });
    await expect(addVisit(form())).rejects.toThrow("redirect:/members?error=save");
  });
});
