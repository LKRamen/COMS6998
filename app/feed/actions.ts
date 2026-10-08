"use server";
import { createClient } from "../../lib/supabase/server";
import { getFeed, type FeedPost } from "../../lib/captions";
export async function loadMoreFeed(sort: unknown, offset: unknown): Promise<{ ok: true; posts: FeedPost[]; hasMore: boolean } | { ok: false; error: string }> {
 if ((sort !== "new" && sort !== "top") || typeof offset !== "number" || !Number.isInteger(offset) || offset < 20 || offset > 10000 || offset % 20 !== 0) return { ok: false, error: "This feed page is unavailable." };
 try {
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  const posts = await getFeed(sort, offset, client, user?.id);
  return { ok: true, posts, hasMore: posts.length === 20 && offset < 10000 };
 } catch { return { ok: false, error: "More captions could not be loaded. Please try again." }; }
}
