import { describe, expect, it, vi } from "vitest";
const { getUser, profile, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(), profile: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("./supabase/server", () => ({ createClient: async () => ({
  auth: { getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) }),
}) }));
import { requireUser, requireCompleteProfile, isProfileComplete } from "./auth";
describe("protected access", () => {
  it("rejects missing and whitespace-only names", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({ first_name: "Ada", last_name: "  " })).toBe(false);
    expect(isProfileComplete({ first_name: " Ada ", last_name: "Lovelace" })).toBe(true);
  });
  it("redirects unauthenticated visitors", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
  it("requires profile completion before the members route", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    profile.mockResolvedValueOnce({ data: { first_name: "Ada", last_name: null }, error: null });
    await expect(requireCompleteProfile()).rejects.toThrow("redirect:/profile");
  });
  it("allows an authenticated user with both names", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    profile.mockResolvedValueOnce({ data: { first_name: "Ada", last_name: "Lovelace" }, error: null });
    expect((await requireCompleteProfile()).user.id).toBe("user-1");
  });
});
