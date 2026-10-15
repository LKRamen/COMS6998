"use server";
import { revalidatePath } from "next/cache";
import { requireCompleteProfile } from "../../lib/auth";
import { retryPhotoCleanup } from "../../lib/captions";
import { isUuid, parseInputs, parseVote, type CaptionInputs } from "../../lib/caption-input";
import { prepareGeneration } from "../../lib/generation-jobs";
type Result = { ok: true; message?: string } | { ok: false; error: string };
function failure(error: unknown): { ok: false; error: string } { return { ok: false, error: error instanceof Error ? error.message : "That action could not be completed. Please try again." }; }
function refresh(id?: string) { revalidatePath("/"); revalidatePath("/feed"); revalidatePath("/explore"); revalidatePath("/profile/[username]", "page"); revalidatePath("/creations"); if (id) { revalidatePath(`/creations/${id}`); revalidatePath(`/meme/${id}`); } }
function idCheck(...ids: unknown[]) { if (!ids.every(isUuid)) throw new Error("This post is unavailable."); }
export async function castVote(captionId: string, value: -1 | 1 | null): Promise<({ ok: true; vote: -1 | 1 | null; score: number }) | { ok: false; error: string }> {
 const { supabase } = await requireCompleteProfile();
 try {
  idCheck(captionId); const vote = parseVote(value);
  const { data, error } = await supabase.rpc("caption_vote", { p_caption_id: captionId, p_value: vote });
  if (error) throw new Error(error.message); refresh();
  return { ok: true, vote: data.vote, score: Number(data.score) };
 } catch (error) { return failure(error); }
}
export async function saveDraft(id: string, inputs: CaptionInputs, selected: string | null, photoRevision: string): Promise<Result> {
 const { supabase } = await requireCompleteProfile();
 try {
  idCheck(id); if (selected) idCheck(selected); idCheck(photoRevision); const value = parseInputs(inputs);
  const { error } = await supabase.rpc("brainrot_save_draft", { p_moment_id: id, p_context: value.context, p_style: value.style, p_selected_caption_id: selected, p_photo_revision: photoRevision });
  if (error) throw new Error(error.message); refresh(id); return { ok: true, message: "Draft saved." };
 } catch (error) { return failure(error); }
}
export async function generateBatch(id: string, requestKey: string): Promise<Result> {
 const { supabase, user } = await requireCompleteProfile();
 try { const prepared = await prepareGeneration(supabase, user.id, id, requestKey); const result = await prepared.perform(); refresh(id); return result; }
 catch (error) { return failure(error); }
}
export async function deleteCreation(id: string): Promise<Result> {
 const { supabase, user } = await requireCompleteProfile();
 try {
  idCheck(id); const { error } = await supabase.rpc("caption_delete", { p_moment_id: id }); if (error) throw new Error(error.message);
  let pending = true; try { pending = (await retryPhotoCleanup(supabase, user.id)) > 0; } catch { /* Post deletion succeeded; cleanup is persisted for retry. */ }
  refresh(id); return { ok: true, message: pending ? "Post removed. Photo cleanup is pending; retry from My creations." : "Post and photo removed." };
 } catch (error) { return failure(error); }
}
export async function cleanupPhotos(): Promise<Result> {
 const { supabase, user } = await requireCompleteProfile();
 try { const pending = await retryPhotoCleanup(supabase, user.id); return { ok: true, message: pending ? "Some photos still need cleanup. Please try again later." : "Photo cleanup complete." }; }
 catch (error) { return failure(error); }
}
