import "server-only";
import { revalidatePath } from "next/cache";
import type { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { getMoment } from "./captions";
import { buildPrompts, isUuid, parseInputs } from "./caption-input";
import { generateCaptions, geminiConfig, generationSettings } from "./ai/gemini";

export type GenerationJob = { id: string; moment_id: string | null; photo_revision: string; state: "pending" | "succeeded" | "failed" | "expired"; run_id: string | null; created_at: string; lease_expires_at: string };
type Client = Awaited<ReturnType<typeof createClient>>;
type Reservation = { id: string; state: GenerationJob["state"]; reused: boolean };
export type PreparedGeneration = { reservation: Reservation; perform: () => Promise<{ ok: true } | { ok: false; error: string }> };

/** Reserve while the HTTP request is alive; only the already-authorized work runs after response. */
export async function prepareGeneration(client: Client, userId: string, id: string, requestKey: string): Promise<PreparedGeneration> {
 if (!isUuid(id) || !isUuid(requestKey)) throw new Error("This draft is unavailable.");
 const { model } = geminiConfig();
 const moment = await getMoment(client, id);
 if (!moment || moment.status !== "draft") throw new Error("Draft is unavailable.");
 const inputs = parseInputs(moment);
 const previous = moment.runs.filter(run => run.photo_revision === moment.photo_revision).slice(0, 5).reverse().flatMap(run => moment.captions.filter(caption => caption.generation_run_id === run.id).map(caption => caption.text));
 const prompts = buildPrompts(inputs, previous, moment.photo_revision);
 const admin = createAdminClient();
 const { data, error } = await admin.rpc("caption_reserve", { p_user_id: userId, p_moment_id: id, p_request_key: requestKey, p_system_prompt: prompts.system, p_user_prompt: prompts.user, p_model: model, p_settings: generationSettings(model) });
 if (error) throw new Error(error.message);
 const reservation = data as Reservation;
 return { reservation, perform: async () => {
  if (reservation.reused) return reservation.state === "succeeded" ? { ok: true } : { ok: false, error: "This generation is already running or has ended. Check its status before trying again." };
  try {
   const { data: snapshot, error: snapshotError } = await admin.from("generation_requests").select("state,photo_path,system_prompt,user_prompt").eq("id", reservation.id).eq("creator_id", userId).single();
   if (snapshotError || !snapshot || snapshot.state !== "pending" || !snapshot.photo_path.startsWith(`${userId}/`)) throw new Error("This generation is no longer active. Your saved draft is safe.");
   const { data: image, error: downloadError } = await admin.storage.from("caption-photos").download(snapshot.photo_path);
   if (downloadError || !image) throw new Error("Your photo could not be loaded. Your draft is saved; try again.");
   const captions = await generateCaptions({ image: Buffer.from(await image.arrayBuffer()), systemPrompt: snapshot.system_prompt, userPrompt: snapshot.user_prompt });
   const finished = await admin.rpc("caption_finish", { p_user_id: userId, p_request_id: reservation.id, p_captions: captions });
   if (finished.error) throw new Error("Your captions could not be saved. Refresh before trying again.");
   revalidatePath(`/creations/${id}`); revalidatePath("/creations");
   return { ok: true };
  } catch (error) {
   // Failed/expired reservations remain visible for recovery; a retry uses a new request key.
   await admin.rpc("caption_fail", { p_user_id: userId, p_request_id: reservation.id });
   return { ok: false, error: error instanceof Error ? error.message : "Generation failed. Your draft is saved; try again." };
  }
 } };
}

/** The caller supplies only the authenticated session's user ID, never a browser parameter. */
export async function getGenerationJobs(userId: string): Promise<GenerationJob[]> {
 const admin = createAdminClient();
 const { data, error } = await admin.from("generation_requests")
  .select("id,moment_id,photo_revision,state,run_id,created_at,lease_expires_at,moment:moments!inner(status,photo_revision)").eq("creator_id", userId).eq("moment.status", "draft").order("created_at", { ascending: false }).limit(20);
 if (error) throw new Error("Generation status could not be loaded. Your saved draft is safe.");
 type StatusRow = GenerationJob & { moment: { status: string; photo_revision: string } };
 return ((data ?? []) as unknown as StatusRow[]).filter(job => job.moment?.status === "draft" && job.moment.photo_revision === job.photo_revision).map(job => ({
  id: job.id, moment_id: job.moment_id, photo_revision: job.photo_revision, run_id: job.run_id, created_at: job.created_at, lease_expires_at: job.lease_expires_at,
  state: job.state === "pending" && Date.parse(job.lease_expires_at) <= Date.now() ? "expired" : job.state,
 }));
}
