// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const { feed, client, getUser } = vi.hoisted(() => ({ feed: vi.fn(), client: vi.fn(), getUser: vi.fn() }));
vi.mock("../../lib/captions", () => ({ getFeed: feed }));
vi.mock("../../lib/supabase/server", () => ({ createClient: client }));
import { loadMoreFeed } from "./actions";
beforeEach(() => { vi.resetAllMocks(); client.mockResolvedValue({ auth: { getUser } }); getUser.mockResolvedValue({ data: { user: null } }); });
it("permits guests to load only the public feed projection", async () => {
 feed.mockResolvedValue([]);
 expect(await loadMoreFeed("new",20)).toEqual({ ok: true, posts: [], hasMore: false });
 expect(feed).toHaveBeenCalledWith("new",20,expect.any(Object),undefined);
});
it("rejects malformed paging before touching the database", async () => {
 expect(await loadMoreFeed("private",20)).toMatchObject({ ok: false });
 expect(await loadMoreFeed("new",20.5)).toMatchObject({ ok: false });
 expect(await loadMoreFeed("new",10020)).toMatchObject({ ok: false });
 expect(client).not.toHaveBeenCalled();
});
