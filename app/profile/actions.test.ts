// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { update, eq, save, upload, remove, readProfile } = vi.hoisted(() => ({
  update: vi.fn(), eq: vi.fn(), save: vi.fn(), upload: vi.fn(), remove: vi.fn(), readProfile: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../lib/auth", () => ({
  requireUser: async () => ({ user: { id: "signed-in-user" }, supabase: {
    from: () => ({ update }), storage: { from: () => ({ upload, remove }) },
  } }), readProfile,
}));
import { saveProfile } from "./actions";
function form(first = " Ada ", last = " Lovelace ") {
  const data = new FormData(); data.set("first_name", first); data.set("last_name", last); return data;
}
describe("profile changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReturnValue({ eq });
    eq.mockReturnValue({ select: () => ({ maybeSingle: save }) });
    readProfile.mockResolvedValue({ avatar_path: null });
    save.mockResolvedValue({ data: { id: "signed-in-user" }, error: null });
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
  });
  it("trims names and ignores user IDs supplied by the form", async () => {
    const data = form(); data.set("id", "someone-else");
    await expect(saveProfile(data)).rejects.toThrow("redirect:/profile?saved=1");
    expect(eq).toHaveBeenCalledWith("id", "signed-in-user");
    expect(update).toHaveBeenCalledWith({ first_name: "Ada", last_name: "Lovelace", avatar_path: null });
  });
  it("rejects whitespace names before modifying the database", async () => {
    await expect(saveProfile(form(" "))).rejects.toThrow("redirect:/profile?error=names");
    expect(update).not.toHaveBeenCalled();
  });
  it("rejects unsupported photo formats", async () => {
    const data = form(); data.set("photo", new File(["<svg/>"], "avatar.svg", { type: "image/svg+xml" }));
    await expect(saveProfile(data)).rejects.toThrow("redirect:/profile?error=photo");
    expect(upload).not.toHaveBeenCalled();
  });
  it("rejects oversized photos", async () => {
    const data = form(); data.set("photo", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "avatar.png", { type: "image/png" }));
    await expect(saveProfile(data)).rejects.toThrow("redirect:/profile?error=photo");
    expect(upload).not.toHaveBeenCalled();
  });
  it("removes the new upload if saving the profile fails", async () => {
    const data = form(); data.set("photo", new File(["image"], "avatar.png", { type: "image/png" }));
    save.mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });
    await expect(saveProfile(data)).rejects.toThrow("redirect:/profile?error=save");
    const path = upload.mock.calls[0][0];
    expect(path).toMatch(/^signed-in-user\/.+\.png$/);
    expect(remove).toHaveBeenCalledWith([path]);
  });
  it("keeps the previous photo if uploading its replacement fails", async () => {
    readProfile.mockResolvedValueOnce({ avatar_path: "signed-in-user/old.png" });
    upload.mockResolvedValueOnce({ error: { message: "storage unavailable" } });
    const data = form(); data.set("photo", new File(["image"], "avatar.png", { type: "image/png" }));
    await expect(saveProfile(data)).rejects.toThrow("redirect:/profile?error=upload");
    expect(update).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  });
});
