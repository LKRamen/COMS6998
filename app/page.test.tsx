import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { feed, getUser } = vi.hoisted(() => ({ feed: vi.fn(), getUser: vi.fn() }));
vi.mock("../lib/captions", () => ({ getFeed: feed }));
vi.mock("../lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock("./auth/actions", () => ({ signOut: vi.fn() }));
vi.mock("./creations/actions", () => ({ castVote: vi.fn(), cleanupPhotos: vi.fn(), deleteCreation: vi.fn() }));
import Home from "./page";
describe("public caption feed", () => {
 afterEach(() => { cleanup(); vi.resetAllMocks(); });
 it("shows an honest empty state and preserves atlas access", async () => {
  feed.mockResolvedValue([]); getUser.mockResolvedValue({ data: { user: null } }); render(await Home({}));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("a caption."); expect(screen.getByRole("link", { name: "Travel atlas" })).toHaveAttribute("href", "/atlas");
  expect(screen.getByRole("link", { name: /Create captions/ })).toHaveAttribute("href", "/login");
 });
 it("shows scores publicly and sign-in instead of voting controls", async () => {
  feed.mockResolvedValue([{ id: "post", caption_id: "caption", text: "A journey", photo_url: "", location: "Kyoto", style: "Postcard", author_name: "Sam", published_at: "2026-10-08T00:00:00Z", score: -2, vote: null, own: false }]);
  getUser.mockResolvedValue({ data: { user: null } }); render(await Home({}));
  expect(screen.getByLabelText("Net score: -2")).toBeInTheDocument(); expect(screen.getByText("Sign in to vote")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Upvote caption" })).not.toBeInTheDocument();
 });
 it("reports failed loading rather than claiming there are no posts", async () => {
  feed.mockRejectedValue(new Error("setup missing")); getUser.mockResolvedValue({ data: { user: null } }); render(await Home({}));
  expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load captions"); expect(screen.queryByText("A moment worth sharing?")).not.toBeInTheDocument();
 });
});
