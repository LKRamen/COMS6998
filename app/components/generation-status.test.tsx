import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GenerationJob } from "../../lib/generation-jobs";
const { status } = vi.hoisted(() => ({ status: vi.fn() }));
vi.mock("../../lib/use-generation-jobs", () => ({ useGenerationJobs: status }));
import GenerationStatus from "./generation-status";
const job: GenerationJob = { id: "my-job", moment_id: "my-draft", photo_revision: "revision", state: "pending", run_id: null, created_at: "2026-10-15T12:00:00Z", lease_expires_at: "2026-10-15T12:05:00Z" };
beforeEach(() => { localStorage.clear(); status.mockReturnValue({ jobs: [job], error: "" }); });
afterEach(cleanup);
it("shows an existing pending generation after returning to another page", () => {
 const page = render(<GenerationStatus/>);
 expect(screen.getByRole("status")).toHaveTextContent("Your captions are cooking");
 expect(screen.getByRole("link", { name: /Open draft/ })).toHaveAttribute("href", "/creations/my-draft");
 page.unmount(); render(<GenerationStatus/>);
 expect(screen.getByRole("status")).toHaveTextContent("Keep scrolling");
});
it("links to saved results and remembers dismissal across navigation", () => {
 status.mockReturnValue({ jobs: [{ ...job, state: "succeeded", run_id: "run" }], error: "" });
 const page = render(<GenerationStatus/>);
 expect(screen.getByRole("link", { name: /See captions/ })).toHaveAttribute("href", "/creations/my-draft");
 fireEvent.click(screen.getByRole("button", { name: "Dismiss generation notice" }));
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
 page.unmount(); render(<GenerationStatus/>); expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("provides a recovery path for an expired worker without showing a permanent spinner", () => {
 status.mockReturnValue({ jobs: [{ ...job, state: "expired" }], error: "" });
 render(<GenerationStatus/>);
 expect(screen.getByRole("status")).toHaveTextContent("needs another try");
 expect(screen.getByRole("link", { name: /Retry in studio/ })).toHaveAttribute("href", "/creations/my-draft");
});
it("explains a safely persisted provider failure", () => {
 status.mockReturnValue({ jobs: [{ ...job, state: "failed", error_message: "The AI provider is temporarily unavailable. Your draft is saved; try again shortly." }], error: "" });
 render(<GenerationStatus/>);
 expect(screen.getByRole("status")).toHaveTextContent("temporarily unavailable");
 expect(screen.getByRole("link", { name: /Retry in studio/ })).toBeInTheDocument();
});
