import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const { discover, getUser, readProfile, redirect } = vi.hoisted(() => ({ discover: vi.fn(), getUser: vi.fn(), readProfile: vi.fn(), redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
vi.mock("../lib/auth", async () => ({ ...(await vi.importActual<typeof import("../lib/auth")>("../lib/auth")), readProfile }));
vi.mock("../lib/memes", () => ({ discover }));
vi.mock("../lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("./components/swipe-deck", () => ({ default: ({ initialPosts }: { initialPosts: { text: string }[] }) => <div aria-label="Community preview">{initialPosts.map(post => post.text).join(",")}</div> }));
import Home from "./page";
describe("Quip public landing", () => {
 afterEach(() => { cleanup(); vi.clearAllMocks(); });
 it("explains creation and discovery without inventing content", async () => {
  discover.mockResolvedValue([]); getUser.mockResolvedValue({ data: { user: null } }); render(await Home());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your brain.Off duty.");
  expect(screen.getByRole("link", { name: "Start swiping" })).toHaveAttribute("href", "/feed");
  expect(screen.getAllByRole("link", { name: /Create with AI/ }).every(link => link.getAttribute("href") === "/login")).toBe(true);
 });
 it("previews real public content", async () => {
  discover.mockResolvedValue([{ text: "A real published caption" }]); getUser.mockResolvedValue({ data: { user: null } }); render(await Home());
  expect(screen.getByLabelText("Community preview")).toHaveTextContent("A real published caption");
 });
 it("reports failure honestly", async () => {
  discover.mockRejectedValue(new Error("network")); getUser.mockResolvedValue({ data: { user: null } }); render(await Home());
  expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load memes");
 });
 it("sends signed-in users to their swipe feed", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user" } } }); readProfile.mockResolvedValue({ username: "sam", display_name: "Sam", username_claimed: true }); await expect(Home()).rejects.toThrow("REDIRECT:/feed");
  expect(discover).not.toHaveBeenCalled();
 });
 it("guides existing accounts with unclaimed handles to choose their username", async () => {
  getUser.mockResolvedValue({ data: { user: { id: "user" } } }); readProfile.mockResolvedValue({ username: "sam", display_name: "Sam", username_claimed: false });
  await expect(Home()).rejects.toThrow("REDIRECT:/profile");
 });
});
