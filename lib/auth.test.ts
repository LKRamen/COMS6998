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
  it("requires an explicitly claimed username and display name", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({ username: "ada", display_name: "Ada", username_claimed: false })).toBe(false);
    expect(isProfileComplete({ username: "  ", display_name: "Ada", username_claimed: true })).toBe(false);
    expect(isProfileComplete({ username: "ada", display_name: "  ", username_claimed: true })).toBe(false);
    expect(isProfileComplete({ username: "ada", display_name: " Ada ", username_claimed: true })).toBe(true);
  });
  it("redirects unauthenticated visitors", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
  it("requires profile completion before creating content", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    profile.mockResolvedValueOnce({ data: { username: "ada", display_name: "Ada", username_claimed: false }, error: null });
    await expect(requireCompleteProfile()).rejects.toThrow("redirect:/profile");
  });
  it("allows an authenticated user with a claimed public identity", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    profile.mockResolvedValueOnce({ data: { username: "ada", display_name: "Ada", username_claimed: true }, error: null });
    expect((await requireCompleteProfile()).user.id).toBe("user-1");
  });
});
