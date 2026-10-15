import "server-only";
import { createClient } from "./supabase/server";
import type { FeedPost } from "./captions";
export type Meme = FeedPost & { username: string; avatar_path: string | null; rendered_path: string | null; upvotes: number; downvotes: number };
export type PublicCreator = { id: string; username: string; display_name: string; bio: string; avatar_path: string | null; created_at: string; memes: number; upvotes: number };
export type DiscoverSort = "swipe" | "new" | "trending" | "top";
type Client = Awaited<ReturnType<typeof createClient>>;
export async function discover(client: Client, options: { sort?: DiscoverSort; query?: string; username?: string; id?: string; offset?: number; exclude?: string[] } = {}): Promise<Meme[]> {
 const { data, error } = await client.rpc("brainrot_discover", { p_sort: options.sort ?? "new", p_query: options.query ?? null, p_username: options.username ?? null, p_id: options.id ?? null, p_offset: options.offset ?? 0, p_exclude: options.exclude ?? [] });
 if (error) throw new Error("Memes couldn’t be loaded. Please try again.");
 return (data ?? []).map((post: Meme) => ({ ...post, score: Number(post.score), upvotes: Number(post.upvotes), downvotes: Number(post.downvotes), photo_url: `/api/meme-image/${post.id}` }));
}
export async function publicCreator(client: Client, username: string): Promise<PublicCreator | null> {
 if (!/^[a-z0-9_]{3,40}$/.test(username)) return null;
 const { data, error } = await client.rpc("brainrot_profile", { p_username: username });
 if (error) throw new Error("This creator couldn’t be loaded. Please try again.");
 return data;
}
