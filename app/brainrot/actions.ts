"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import { getMoment } from "../../lib/captions";
import { discover } from "../../lib/memes";
import { isUuid, parseVote } from "../../lib/caption-input";
import { renderMeme } from "../../lib/meme-render";
function refresh(id?: string) {
 for (const path of ["/", "/feed", "/explore", "/creations", "/profile"]) revalidatePath(path);
 revalidatePath("/profile/[username]", "page");
 revalidatePath("/meme/[id]", "page");
 if (id) { revalidatePath(`/meme/${id}`); revalidatePath(`/creations/${id}`); }
}
export async function voteMeme(captionId: string, value: -1 | 1 | null): Promise<{ ok: true; vote: -1 | 1 | null; score: number } | { ok: false; error: string; login?: boolean }> {
 try {
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, login: true, error: "Your session ended. Sign in to save your vote." };
  if (!isUuid(captionId)) throw new Error("This meme is unavailable.");
  const vote = parseVote(value);
  const { data, error } = await client.rpc("caption_vote", { p_caption_id: captionId, p_value: vote });
  if (error) throw new Error(error.message);
  // Swipe clients reconcile their local queue; no page refresh interrupts the animation.
  refresh(); return { ok: true, vote: data.vote, score: Number(data.score) };
 } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Your vote couldn’t be saved. Please try again." }; }
}
export async function loadSwipeMemes(exclude: string[]) {
 if (!Array.isArray(exclude) || exclude.length > 2000 || !exclude.every(isUuid)) return { ok: false as const, error: "Please refresh the feed to continue." };
 try { return { ok: true as const, posts: await discover(await createClient(), { sort: "swipe", exclude }) }; }
 catch { return { ok: false as const, error: "More memes couldn’t be loaded. Try again." }; }
}
export async function saveMemeCaption(id: string, captionId: string, text: string) {
 try {
  if (!isUuid(id) || !isUuid(captionId) || typeof text !== "string" || !text.trim() || text.length > 240) throw new Error("Choose a caption with 1–240 characters.");
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Sign in again to save your draft.");
  const { error } = await client.rpc("brainrot_save_caption", { p_moment_id: id, p_caption_id: captionId, p_text: text });
  if (error) throw new Error(error.message);
  revalidatePath(`/creations/${id}`); return { ok: true as const };
 } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : "Your caption couldn’t be saved." }; }
}
export async function publishMeme(id: string, captionId: string, text: string) {
 let uploaded: string | null = null; let owner: string | null = null;
 try {
  if (!isUuid(id) || !isUuid(captionId) || typeof text !== "string" || !text.trim() || text.length > 240) throw new Error("Choose a caption with 1–240 characters.");
  const client = await createClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Sign in again to publish. Your saved draft is safe.");
  owner = user.id;
  const moment = await getMoment(client, id);
  if (!moment) throw new Error("Your draft is unavailable.");
  if (moment.status === "published") {
   if (moment.selected_caption_id !== captionId || moment.caption_override !== text.trim()) throw new Error("This meme is already published.");
   return { ok: true as const, id };
  }
  const candidate = moment.captions.find(c => c.id === captionId);
  if (!candidate || !moment.runs.some(r => r.id === candidate.generation_run_id && r.photo_revision === moment.photo_revision)) throw new Error("Choose a caption generated for this photo.");
  const source = await client.storage.from("caption-photos").download(moment.photo_path);
  if (source.error || !source.data) throw new Error("Your image couldn’t be loaded. Try again.");
  const bytes = await renderMeme(Buffer.from(await source.data.arrayBuffer()), text.trim());
  const path = `${user.id}/${id}/${crypto.randomUUID()}.jpg`;
  const admin = createAdminClient();
  const result = await admin.storage.from("caption-photos").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (result.error) throw new Error("Your meme image couldn’t be saved. Your draft is safe; try again.");
  uploaded = path;
  const published = await client.rpc("brainrot_publish", { p_moment_id: id, p_caption_id: captionId, p_text: text.trim(), p_rendered_path: path });
  if (published.error) throw new Error(published.error.message);
  // A concurrent identical publication may win. Remove only our unreferenced render.
  const current = await admin.from("moments").select("rendered_path").eq("id", id).eq("creator_id", user.id).maybeSingle();
  if (!current.error && current.data?.rendered_path !== path) await admin.storage.from("caption-photos").remove([path]);
  refresh(id); return { ok: true as const, id };
 } catch (error) {
  if (uploaded && owner) {
   try {
    const admin = createAdminClient(); const current = await admin.from("moments").select("rendered_path").eq("id", id).eq("creator_id", owner).maybeSingle();
    // An ambiguous response may have committed publication. Never delete a referenced image.
    if (!current.error && current.data?.rendered_path !== uploaded) {
     const removed = await admin.storage.from("caption-photos").remove([uploaded]);
     if (removed.error) await admin.from("photo_cleanup_requests").insert({ creator_id: owner, photo_path: uploaded });
    }
   } catch { /* Preserve a possibly referenced asset; no unsafe automatic cleanup. */ }
  }
  return { ok: false as const, error: error instanceof Error ? error.message : "Publishing failed. Your saved draft is safe." };
 }
}
