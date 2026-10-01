// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
const { oauth, signOut, redirect } = vi.hoisted(() => ({
  oauth: vi.fn(), signOut: vi.fn(),
  redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ origin: "https://assignment-commit.vercel.app" }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("../../lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOAuth: oauth, signOut } }) }));
import { signInWithGoogle } from "./actions";

describe("Google OAuth", () => {
  it("uses exactly the application callback on the current deployment origin", async () => {
    oauth.mockResolvedValueOnce({ data: { url: "https://accounts.google.com/login" }, error: null });
    await expect(signInWithGoogle()).rejects.toThrow("redirect:https://accounts.google.com/login");
    expect(oauth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: "https://assignment-commit.vercel.app/auth/callback" } });
  });
  it("shows a recoverable login error when Google authorization fails", async () => {
    oauth.mockResolvedValueOnce({ data: { url: null }, error: { message: "provider disabled" } });
    await expect(signInWithGoogle()).rejects.toThrow("redirect:/login?error=signin");
  });
});
