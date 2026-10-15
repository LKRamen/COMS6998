import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const { creations, auth } = vi.hoisted(() => ({ creations: vi.fn(), auth: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireCompleteProfile: auth }));
vi.mock("../../lib/captions", () => ({ getCreations: creations }));
vi.mock("../components/app-shell", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("../components/creation-controls", () => ({ default: () => <button>Delete controls</button> }));
import Creations from "./page";
const rows = [
 { id: "draft", status: "draft", caption: "The draft caption", photo_url: "/draft.jpg", created_at: "2026-10-15T12:00:00Z", style: "Brainrot" },
 { id: "published", status: "published", caption: "The published caption", photo_url: "/api/meme-image/published", created_at: "2026-10-14T12:00:00Z", published_at: "2026-10-15T12:00:00Z", style: "Brainrot", rendered_path: "rendered.jpg" },
];
beforeEach(() => { cleanup(); vi.clearAllMocks(); auth.mockResolvedValue({ supabase: "session", user: { id: "owner" } }); creations.mockResolvedValue(rows); });
it("shows accurate totals and filters drafts without losing the published count", async () => {
 render(await Creations({ searchParams: Promise.resolve({ status: "draft" }) }));
 expect(creations).toHaveBeenCalledWith("session", "owner");
 expect(screen.getByRole("link", { name: "All 2" })).toBeInTheDocument();
 expect(screen.getByRole("link", { name: "Drafts 1" })).toHaveAttribute("aria-current", "page");
 expect(screen.getByRole("link", { name: "Published 1" })).toBeInTheDocument();
 expect(screen.getByRole("heading", { name: "The draft caption" })).toBeInTheDocument();
 expect(screen.queryByRole("heading", { name: "The published caption" })).not.toBeInTheDocument();
 expect(screen.getByRole("link", { name: /Continue draft/ })).toHaveAttribute("href", "/creations/draft");
});
it("links published posts and private history and does not duplicate baked-in captions", async () => {
 render(await Creations({ searchParams: Promise.resolve({ status: "published" }) }));
 expect(screen.getByRole("link", { name: /View public post/ })).toHaveAttribute("href", "/meme/published");
 expect(screen.getByRole("link", { name: /Private history/ })).toHaveAttribute("href", "/creations/published");
 expect(document.querySelector(".meme-overlay-caption")).toBeNull();
});
it("offers existing drafts when there are no published posts", async () => {
 creations.mockResolvedValue([rows[0]]);
 render(await Creations({ searchParams: Promise.resolve({ status: "published" }) }));
 expect(screen.getByRole("link", { name: /Browse your drafts/ })).toHaveAttribute("href", "/creations?status=draft");
 expect(screen.queryByRole("region", { name: "Your creations" })).not.toBeInTheDocument();
});
it("shows a retry state instead of misleading zero counts when loading fails", async () => {
 creations.mockRejectedValue(new Error("private backend detail"));
 render(await Creations({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("alert")).toHaveTextContent("Your creations couldn’t be loaded.");
 expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/creations");
 expect(screen.queryByRole("navigation", { name: "Filter your creations" })).not.toBeInTheDocument();
 expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
});

it("shows the meme and caption without place or style labels", async () => {
 creations.mockResolvedValue([{ ...rows[1], style: "NYC", location: "New York City", country_code: "US" }]);
 render(await Creations({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("heading", { name: "The published caption" })).toBeInTheDocument();
 expect(screen.getByRole("img", { name: "The published caption" })).toHaveAttribute("src", "/api/meme-image/published");
 expect(screen.queryByText("NYC")).not.toBeInTheDocument();
 expect(screen.queryByText("New York City")).not.toBeInTheDocument();
});
