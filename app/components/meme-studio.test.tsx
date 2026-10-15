import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Moment } from "../../lib/captions";
const { save, caption, refresh } = vi.hoisted(() => ({ save: vi.fn(), caption: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));
vi.mock("../creations/actions", () => ({ saveDraft: save }));
vi.mock("../brainrot/actions", () => ({ saveMemeCaption: caption, publishMeme: vi.fn() }));
vi.mock("./studio-upload", () => ({ default: () => null }));
import MemeStudio from "./meme-studio";
const moment: Moment = { id: "draft", photo_revision: "revision", photo_path: "", photo_url: "/photo.jpg", context: "", style: "Brainrot", status: "draft", selected_caption_id: null, created_at: "", published_at: null, captions: [], runs: [] };
beforeEach(() => { vi.useFakeTimers(); sessionStorage.clear(); save.mockReset().mockResolvedValue({ ok: true }); caption.mockReset().mockResolvedValue({ ok: true }); refresh.mockReset(); vi.stubGlobal("fetch", vi.fn(async (_url, options) => options?.method === "POST" ? { ok: false, json: async () => ({ error: "The AI provider is temporarily at its limit." }) } : { ok: true, json: async () => ({ jobs: [] }) })); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it("persists a reverted edit after an earlier slow save", async () => {
 let finish!: (value: unknown) => void;
 save.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ ok: true });
 render(<MemeStudio moment={moment}/>);
 fireEvent.change(screen.getByRole("textbox", { name: /^The context/ }), { target: { value: "first edit" } });
 await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
 fireEvent.change(screen.getByRole("textbox", { name: /^The context/ }), { target: { value: "" } });
 await act(async () => { finish({ ok: true }); await vi.advanceTimersByTimeAsync(1500); });
 expect(save).toHaveBeenLastCalledWith("draft", expect.objectContaining({ context: "" }), null, "revision");
});
it("offers recovery of a local backup after a failed save or interrupted navigation", async () => {
 sessionStorage.setItem("brainrot:draft:draft:revision", JSON.stringify({ inputs: { context: "Recover this joke", location: "", style: "Brainrot" }, selected: null, text: "" }));
 render(<MemeStudio moment={moment}/>);
 fireEvent.click(screen.getByRole("button", { name: "Restore local draft" }));
 expect(screen.getByRole("textbox", { name: /^The context/ })).toHaveValue("Recover this joke");
 await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
 expect(save).toHaveBeenCalledWith("draft", expect.objectContaining({ context: "Recover this joke" }), null, "revision");
});
it("retains uploaded content and a useful error when generation fails", async () => {

 render(<MemeStudio moment={{ ...moment, context: "Saved context" }}/>);
 fireEvent.click(screen.getByRole("button", { name: "Generate captions" }));
 await act(async () => { await vi.advanceTimersByTimeAsync(0); });
 expect(screen.getByRole("alert")).toHaveTextContent("temporarily at its limit");
 expect(screen.getByRole("textbox", { name: /^The context/ })).toHaveValue("Saved context");
 expect(screen.getByRole("button", { name: "Generate captions" })).toBeEnabled();
});
it("lets the user return to the feed as soon as generation is reserved", async () => {
 vi.stubGlobal("fetch", vi.fn(async (_url, options) => options?.method === "POST" ? { ok: true, json: async () => ({ job: { id: "running-job", state: "pending" } }) } : { ok: true, json: async () => ({ jobs: [] }) }));
 const view = render(<MemeStudio moment={moment}/>);
 fireEvent.click(screen.getByRole("button", { name: "Generate captions" }));
 await act(async () => { await vi.advanceTimersByTimeAsync(0); });
 expect(screen.getByRole("link", { name: /Keep scrolling/ })).toHaveAttribute("href", "/feed");
 expect(screen.getByRole("button", { name: /Letting AI cook/ })).toBeDisabled();
 view.unmount();
 expect(vi.mocked(fetch).mock.calls.some(([, options]) => options?.method === "POST" && options.keepalive === true)).toBe(true);
});
it("recovers an in-progress job after navigation and refreshes when its saved captions are ready", async () => {
 let state = "pending";
 vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ jobs: [{ id: "running-job", moment_id: moment.id, photo_revision: moment.photo_revision, state, run_id: state === "succeeded" ? "completed-run" : null }] }) })));
 render(<MemeStudio moment={moment}/>);
 await act(async () => { await vi.advanceTimersByTimeAsync(0); });
 expect(screen.getByRole("button", { name: /Letting AI cook/ })).toBeDisabled();
 state = "succeeded";
 await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
 expect(refresh).toHaveBeenCalledOnce();
 expect(screen.getByRole("button", { name: "Generate captions" })).toBeEnabled();
});
it("shows the saved provider failure after returning to the studio and allows retry", async () => {
 vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ jobs: [{ id: "failed-job", moment_id: moment.id, photo_revision: moment.photo_revision, state: "failed", error_message: "The AI provider is temporarily unavailable. Your draft is saved; try again shortly." }] }) })));
 render(<MemeStudio moment={moment}/>);
 await act(async () => { await vi.advanceTimersByTimeAsync(0); });
 expect(screen.getByRole("alert")).toHaveTextContent("temporarily unavailable");
 expect(screen.getByRole("button", { name: "Generate captions" })).toBeEnabled();
});
