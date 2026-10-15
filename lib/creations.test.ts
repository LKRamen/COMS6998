// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("./supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { getCreations } from "./captions";

function fixture(error: unknown = null) {
 const rows = [
  { id: "draft", status: "draft", photo_path: "owner/private.jpg", selected_caption_id: "caption-draft", caption_override: null },
  { id: "published", status: "published", photo_path: "owner/source.jpg", selected_caption_id: "caption-public", caption_override: "My final caption", rendered_path: "owner/rendered.jpg" },
 ];
 const moments = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: rows, error }) };
 const captions = { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [{ id: "caption-draft", text: "A saved idea" }, { id: "caption-public", text: "Original caption" }], error: null }) };
 const signed = vi.fn().mockResolvedValue({ data: { signedUrl: "https://private.example/signed" }, error: null });
 const client = { from: vi.fn((table: string) => table === "moments" ? moments : captions), storage: { from: vi.fn(() => ({ createSignedUrl: signed })) } };
 return { client, moments, captions, signed };
}

it("scopes the private list to the authenticated owner and fetches no generation prompts", async () => {
 const { client, moments } = fixture();
 await getCreations(client as never, "owner");
 expect(moments.eq).toHaveBeenCalledWith("creator_id", "owner");
 expect(client.from.mock.calls.map(([table]) => table)).not.toContain("generation_runs");
 expect(moments.select.mock.calls[0][0]).not.toMatch(/context|prompt/);
});

it("uses private signed draft previews and stable public rendered previews with saved caption text", async () => {
 const { client, captions, signed } = fixture();
 const rows = await getCreations(client as never, "owner");
 expect(rows[0]).toMatchObject({ photo_url: "https://private.example/signed", caption: "A saved idea" });
 expect(rows[1]).toMatchObject({ photo_url: "/api/meme-image/published", caption: "My final caption", rendered_path: "owner/rendered.jpg" });
 expect(signed).toHaveBeenCalledExactlyOnceWith("owner/private.jpg", 300);
 expect(captions.in).toHaveBeenCalledWith("id", ["caption-draft", "caption-public"]);
});

it("fails closed when the owned list cannot be loaded", async () => {
 const { client, signed } = fixture({ message: "database unavailable" });
 await expect(getCreations(client as never, "owner")).rejects.toThrow("Your creations could not be loaded.");
 expect(signed).not.toHaveBeenCalled();
});
