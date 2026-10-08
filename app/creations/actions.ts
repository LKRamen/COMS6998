"use server";
import { revalidatePath } from "next/cache";
import { requireCompleteProfile } from "../../lib/auth";
import { createAdminClient } from "../../lib/supabase/admin";
import { getMoment, retryPhotoCleanup } from "../../lib/captions";
import { buildPrompts, isUuid, parseInputs, parseVote, type CaptionInputs } from "../../lib/caption-input";
import { generateCaptions, geminiConfig, generationSettings } from "../../lib/ai/gemini";
type Result = { ok: true; message?: string } | { ok: false; error: string };
function failure(error: unknown): { ok: false; error: string } { return { ok: false, error: error instanceof Error ? error.message : "That action could not be completed. Please try again." }; }
function refresh(id?: string) { revalidatePath("/"); revalidatePath("/creations"); if (id) revalidatePath(`/creations/${id}`); }
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
export async function saveDraft(id: string, inputs: CaptionInputs, selected: string | null): Promise<Result> {
 const { supabase } = await requireCompleteProfile();
 try {
  idCheck(id); if (selected) idCheck(selected); const value = parseInputs(inputs);
  const { error } = await supabase.rpc("caption_save_draft", { p_moment_id: id, p_context: value.context, p_location: value.location, p_style: value.style, p_selected_caption_id: selected });
  if (error) throw new Error(error.message); refresh(id); return { ok: true, message: "Draft saved." };
 } catch (error) { return failure(error); }
}
export async function generateBatch(id: string, requestKey: string): Promise<Result> {
 const { supabase, user } = await requireCompleteProfile(); let requestId: string | null = null;
 let admin: ReturnType<typeof createAdminClient> | null = null;
 try {
  idCheck(id, requestKey); const { model } = geminiConfig(); admin = createAdminClient();
  const moment = await getMoment(supabase, id);
  if (!moment || moment.status !== "draft") throw new Error("Draft is unavailable.");
  const inputs = parseInputs(moment);
  const previous = moment.runs.filter(run => run.photo_revision === moment.photo_revision).slice(0, 5).reverse().flatMap(run => moment.captions.filter(c => c.generation_run_id === run.id).map(c => c.text));
  const prompts = buildPrompts(inputs, previous, moment.photo_revision);
  const { data: reservation, error } = await admin.rpc("caption_reserve", { p_user_id: user.id, p_moment_id: id, p_request_key: requestKey, p_system_prompt: prompts.system, p_user_prompt: prompts.user, p_model: model, p_settings: generationSettings(model) });
  if (error) throw new Error(error.message);
  if (reservation.reused) {
   if (reservation.state === "succeeded") { refresh(id); return { ok: true, message: "Your captions are already saved." }; }
   throw new Error("This request is already running or has ended. Refresh before generating again.");
  }
  requestId = reservation.id;
  const { data: image, error: downloadError } = await supabase.storage.from("caption-photos").download(moment.photo_path);
  if (downloadError || !image) throw new Error("Your photo could not be loaded. Please try again.");
  const captions = await generateCaptions({ image: Buffer.from(await image.arrayBuffer()), systemPrompt: prompts.system, userPrompt: prompts.user });
  const finished = await admin.rpc("caption_finish", { p_user_id: user.id, p_request_id: requestId, p_captions: captions });
  if (finished.error) throw new Error("Your captions could not be saved. Refresh before trying again.");
  refresh(id); return { ok: true, message: "Three new captions saved." };
 } catch (error) {
  if (requestId && admin) await admin.rpc("caption_fail", { p_user_id: user.id, p_request_id: requestId });
  refresh(id); return failure(error);
 }
}
export async function publishCaption(id: string, captionId: string): Promise<Result> {
 const { supabase } = await requireCompleteProfile();
 try { idCheck(id, captionId); const { error } = await supabase.rpc("caption_publish", { p_moment_id: id, p_caption_id: captionId }); if (error) throw new Error(error.message); refresh(id); return { ok: true }; }
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
