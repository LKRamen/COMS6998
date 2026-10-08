"use server";
import { createClient } from "../../lib/supabase/server";
import { getFeed, type FeedPost } from "../../lib/captions";
import { isCountryCode } from "../../lib/countries";
export async function loadMoreFeed(sort: unknown, offset: unknown, country?: string): Promise<{ ok: true; posts: FeedPost[]; hasMore: boolean } | { ok: false; error: string }> {
 if (country !== undefined && !isCountryCode(country)) return { ok: false, error: "Choose a valid country." };
 if ((sort !== "new" && sort !== "top") || typeof offset !== "number" || !Number.isInteger(offset) || offset < 20 || offset > 10000 || offset % 20 !== 0) return { ok: false, error: "This feed page is unavailable." };
 try {
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  const posts = country ? await getFeed(sort, offset, client, user?.id, country) : await getFeed(sort, offset, client, user?.id);
  return { ok: true, posts, hasMore: posts.length === 20 && offset < 10000 };
 } catch { return { ok: false, error: "More captions could not be loaded. Please try again." }; }
}
