// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => {
 const download = vi.fn(), signed = vi.fn(), rpc = vi.fn();
 const client = { rpc, storage: { from: vi.fn(() => ({ download, createSignedUrl: signed })) } };
 return { download, signed, rpc, client, publicClient: vi.fn(() => client), cookieClient: vi.fn(async () => client) };
});
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.publicClient }));
vi.mock("../../../../lib/supabase/server", () => ({ createClient: mocks.cookieClient, supabaseConfig: () => ({ url: "https://project.supabase.co", key: "public-key" }) }));
import { GET } from "./route";
const id = "10000000-0000-4000-8000-000000000001";
const request = (suffix = "") => GET(new Request(`https://brainrot.test/api/meme-image/${id}${suffix}`, { headers: { cookie: "untrusted-session=value" } }), { params: Promise.resolve({ id }) });
beforeEach(() => {
 vi.clearAllMocks();
 mocks.rpc.mockResolvedValue({ data: [{ photo_path: "owner/source.jpg", rendered_path: "owner/rendered.jpg" }], error: null });
 mocks.download.mockResolvedValue({ data: new Blob(["image pixels"], { type: "image/jpeg" }), error: null });
 mocks.signed.mockResolvedValue({ data: { signedUrl: "https://storage.test/image" }, error: null });
});
it("returns published image bytes directly with bounded browser/CDN caching, without a signed redirect", async () => {
 const response = await request();
 expect(response.status).toBe(200);
 expect(await response.text()).toBe("image pixels");
 expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, s-maxage=300");
 expect(response.headers.get("Content-Type")).toBe("image/jpeg");
 expect(response.headers.has("location")).toBe(false);
 expect(response.headers.has("set-cookie")).toBe(false);
 expect(mocks.download).toHaveBeenCalledWith("owner/rendered.jpg");
 expect(mocks.signed).not.toHaveBeenCalled();
});
it("checks published access using an anonymous client regardless of supplied session cookies", async () => {
 await request("?source=1");
 expect(mocks.publicClient).toHaveBeenCalledWith("https://project.supabase.co", "public-key", { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
 expect(mocks.cookieClient).not.toHaveBeenCalled();
 expect(mocks.rpc).toHaveBeenCalledWith("brainrot_discover", { p_id: id });
 expect(mocks.download).toHaveBeenCalledWith("owner/source.jpg");
});
it("never downloads or caches an unpublished or missing meme", async () => {
 mocks.rpc.mockResolvedValue({ data: [], error: null });
 const response = await request();
 expect(response.status).toBe(404); expect(response.headers.get("Cache-Control")).toBe("no-store");
 expect(mocks.download).not.toHaveBeenCalled();
});
it("does not cache database or image failures", async () => {
 mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });
 let response = await request();
 expect(response.status).toBe(503); expect(response.headers.get("Cache-Control")).toBe("no-store");
 mocks.download.mockResolvedValue({ data: null, error: { message: "storage unavailable" } });
 response = await request();
 expect(response.status).toBe(503); expect(response.headers.get("Cache-Control")).toBe("no-store");
});
