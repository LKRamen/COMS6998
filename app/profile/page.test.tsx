import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const { read } = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("../../lib/auth", async () => ({
 ...(await vi.importActual<typeof import("../../lib/auth")>("../../lib/auth")),
 requireUser: async () => ({ user: { id: "owner", email: "owner@example.invalid", user_metadata: {} }, supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: read }) }) }),
 } }),
}));
vi.mock("../auth/actions", () => ({ signOut: vi.fn() }));
vi.mock("./creator-actions", () => ({ saveCreatorProfile: vi.fn() }));
import ProfileSettings from "./page";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("offers an existing readable handle for explicit confirmation without locking browsing", async () => {
 read.mockResolvedValue({ data: { username: "sam_online", display_name: "Sam", username_claimed: false }, error: null });
 render(await ProfileSettings({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("textbox", { name: /^Username/ })).toHaveValue("sam_online");
 expect(screen.getByRole("button", { name: "Create my profile" })).toBeInTheDocument();
 expect(screen.getByRole("link", { name: "Keep browsing for now" })).toHaveAttribute("href", "/feed");
 expect(within(screen.getByRole("navigation", { name: "Account links" })).queryByRole("link", { name: /travel|atlas/i })).not.toBeInTheDocument();
});
it("does not erase a personally chosen username that starts with user_", async () => {
 read.mockResolvedValue({ data: { username: "user_experience", display_name: "Sam", username_claimed: true }, error: null });
 render(await ProfileSettings({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("textbox", { name: /^Username/ })).toHaveValue("user_experience");
 expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
});
it("lets a new account choose its own handle without an assigned UUID username", async () => {
 read.mockResolvedValue({ data: null, error: null });
 render(await ProfileSettings({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("textbox", { name: /^Username/ })).toHaveValue("");
 expect(screen.getByRole("textbox", { name: /^Display name/ })).toBeRequired();
});
