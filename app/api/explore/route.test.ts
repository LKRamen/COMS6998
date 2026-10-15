import { afterEach, expect, it, vi } from "vitest";
const { discover, createClient } = vi.hoisted(() => ({ discover: vi.fn(), createClient: vi.fn().mockResolvedValue({}) }));
vi.mock("../../../lib/memes", () => ({ discover }));
vi.mock("../../../lib/supabase/server", () => ({ createClient }));
import { GET } from "./route";
afterEach(() => { vi.clearAllMocks(); });
it("loads the next ranked batch using the request session and never caches personalized votes", async () => {
 discover.mockResolvedValue(Array.from({ length: 20 }, (_, id) => ({ id })));
 const result=await GET(new Request("https://quip.test/api/explore?sort=top&q=%40sam&offset=20"));
 expect(result.status).toBe(200); expect(result.headers.get("cache-control")).toBe("private, no-store");
 expect(discover).toHaveBeenCalledWith({}, { sort: "top", query: "sam", offset: 20 });
 expect(await result.json()).toMatchObject({ hasMore: true, nextOffset: 40 });
});
it("rejects malformed sorts and offsets without querying data", async () => {
 for (const query of ["sort=swipe", "sort=top&offset=-1", "offset=1.2", "offset=NaN", "offset=10001"]) {
  expect((await GET(new Request(`https://quip.test/api/explore?${query}`))).status).toBe(400);
 }
 expect(discover).not.toHaveBeenCalled();
});
it("ends on a short batch and returns a retryable read failure", async () => {
 discover.mockResolvedValueOnce([{ id: "last" }]).mockRejectedValueOnce(new Error("private database details"));
 const result=await GET(new Request("https://quip.test/api/explore?sort=new&offset=80"));
 expect(await result.json()).toMatchObject({ hasMore: false, nextOffset: 81 });
 const failed=await GET(new Request("https://quip.test/api/explore"));
 expect(failed.status).toBe(503); expect(JSON.stringify(await failed.json())).not.toContain("database details");
});
