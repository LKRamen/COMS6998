import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { push, refresh, announce } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), announce: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("../../lib/use-generation-jobs", () => ({ announceGenerationChange: announce }));
import StudioUpload from "./studio-upload";
beforeEach(() => {
 vi.clearAllMocks();
 URL.createObjectURL = vi.fn(() => "blob:photo"); URL.revokeObjectURL = vi.fn();
 vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })));
 vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
 vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["photo"], { type: "image/jpeg" })));
 vi.stubGlobal("fetch", vi.fn(async (url) => ({ ok: true, json: async () => url === "/api/caption-photo" ? { id: "saved-draft" } : { job: { id: "job", state: "pending" } } })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function choosePhoto() { fireEvent.change(screen.getByLabelText("Choose meme image"), { target: { files: [new File(["image"], "photo.png", { type: "image/png" })] } }); }
it("saves the selected photo, style and context then starts generation with one action", async () => {
 const view = render(<StudioUpload/>); choosePhoto();
 expect(screen.getByRole("button", { name: "Generate captions" })).toBeEnabled();
 fireEvent.change(screen.getByRole("textbox"), { target: { value: "Our team meeting" } });
 fireEvent.click(screen.getByRole("button", { name: "Dry sarcasm" }));
 fireEvent.submit(view.container.querySelector("form")!);
 await waitFor(() => expect(push).toHaveBeenCalledWith("/creations/saved-draft"));
 const requests = vi.mocked(fetch).mock.calls;
 expect(requests.map(([url]) => url)).toEqual(["/api/caption-photo", "/api/generations"]);
 const form = requests[0][1]?.body as FormData;
 expect(form.get("context")).toBe("Our team meeting"); expect(form.get("style")).toBe("Dry sarcasm"); expect(form.get("photo")).toBeInstanceOf(File);
 expect(JSON.parse(requests[1][1]?.body as string)).toEqual({ momentId: "saved-draft", requestKey: expect.any(String) });
 expect(requests[1][1]?.keepalive).toBe(true); expect(announce).toHaveBeenCalledOnce();
});
it("retries an uncertain reservation with the same key and saved photo, with a recovery link", async () => {
 vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ id: "saved-draft" }) } as Response).mockRejectedValueOnce(new Error("Connection lost"));
 const view = render(<StudioUpload/>); choosePhoto(); fireEvent.submit(view.container.querySelector("form")!);
 await screen.findByRole("alert");
 expect(screen.getByRole("alert")).toHaveTextContent("photo and context are saved");
 expect(screen.getByRole("link", { name: /Open saved draft/ })).toHaveAttribute("href", "/creations/saved-draft");
 fireEvent.click(screen.getByRole("button", { name: "Retry generation" }));
 await waitFor(() => expect(push).toHaveBeenCalled());
 const requests = vi.mocked(fetch).mock.calls;
 expect(requests.map(([url]) => url)).toEqual(["/api/caption-photo", "/api/generations", "/api/generations"]);
 expect(requests[1][1]?.body).toBe(requests[2][1]?.body);
});
it("blocks repeat submits while reserving captions and preserves replacement identity", async () => {
 let complete!: (value: Response) => void;
 vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ id: "replacement" }) } as Response).mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
 const view = render(<StudioUpload momentId="replacement"/>); choosePhoto();
 expect(screen.getByRole("button", { name: "Replace & generate" })).toBeEnabled();
 fireEvent.submit(view.container.querySelector("form")!);
 await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
 fireEvent.submit(view.container.querySelector("form")!);
 expect(fetch).toHaveBeenCalledTimes(2); expect(screen.getByRole("button", { name: /Starting captions/ })).toBeDisabled();
 expect((vi.mocked(fetch).mock.calls[0][1]?.body as FormData).get("moment_id")).toBe("replacement");
 await act(async () => complete({ ok: true, json: async () => ({ job: { id: "job", state: "pending" } }) } as Response));
 expect(push).toHaveBeenCalledWith("/creations/replacement");
});
it("keeps the selected image and context when saving fails, and never generates an unsaved photo", async () => {
 vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Your draft could not be saved. Please try again." }) } as Response);
 render(<StudioUpload/>); choosePhoto();
 fireEvent.change(screen.getByRole("textbox"), { target: { value: "Keep this context" } });
 fireEvent.click(screen.getByRole("button", { name: "Generate captions" }));
 expect(await screen.findByRole("alert")).toHaveTextContent("draft could not be saved");
 expect(fetch).toHaveBeenCalledTimes(1); expect(push).not.toHaveBeenCalled();
 expect(screen.getByRole("textbox")).toHaveValue("Keep this context");
 expect(screen.getByRole("img")).toHaveAttribute("src", "blob:photo");
 expect(screen.getByRole("button", { name: "Generate captions" })).toBeEnabled();
});
