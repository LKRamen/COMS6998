import "server-only";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type { CaptionInputs } from "./caption-input";
export type Caption = { id: string; text: string; ordinal: number; generation_run_id: string; moment_id: string };
export type CaptionRun = CaptionInputs & { id: string; system_prompt: string; user_prompt: string; model: string; created_at: string; photo_revision: string };
export type Moment = CaptionInputs & { id: string; photo_path: string; photo_revision: string; status: "draft" | "published"; selected_caption_id: string | null; caption_override?: string | null; rendered_path?: string | null; created_at: string; published_at: string | null; photo_url: string; captions: Caption[]; runs: CaptionRun[] };
export type Allowance = { remaining: number | null; reset_at: string | null };
type Client = Awaited<ReturnType<typeof createClient>>;
async function imageUrl(client: Client, path: string) {
 const { data, error } = await client.storage.from("caption-photos").createSignedUrl(path, 300);
 if (error || !data) return "";
 return data.signedUrl;
}
export async function getMoment(client: Client, id: string): Promise<Moment | null> {
 const { data, error } = await client.from("moments").select("id,photo_path,photo_revision,context,style,status,selected_caption_id,caption_override,rendered_path,created_at,published_at").eq("id", id).maybeSingle();
 if (error) throw new Error("Your draft could not be loaded.");
 if (!data) return null;
 const [captions, runs] = await Promise.all([client.from("captions").select("id,text,ordinal,generation_run_id,moment_id").eq("moment_id", id).order("ordinal"), client.from("generation_runs").select("id,context,style,system_prompt,user_prompt,model,created_at,photo_revision").eq("moment_id", id).order("created_at", { ascending: false })]);
 if (captions.error || runs.error) throw new Error("Your saved caption batches could not be loaded.");
 return { ...data, photo_url: await imageUrl(client, data.photo_path), captions: captions.data ?? [], runs: runs.data ?? [] } as Moment;
}
export async function getCreations(client: Client) {
 const { data, error } = await client.from("moments").select("id,status,created_at,photo_path").order("created_at", { ascending: false });
 if (error) throw new Error("Your creations could not be loaded.");
 return Promise.all((data ?? []).map(async row => ({ ...row, photo_url: await imageUrl(client, row.photo_path) })));
}
export async function getAllowance(client: Client): Promise<Allowance> {
 const { data, error } = await client.rpc("caption_allowance");
 if (error) throw new Error("Your generation allowance could not be loaded.");
 return data as Allowance;
}
export async function retryPhotoCleanup(client: Client, userId: string): Promise<number> {
 const { data, error } = await client.from("photo_cleanup_requests").select("photo_path").eq("creator_id", userId);
 if (error) throw new Error("Photo cleanup could not be checked.");
 if (!data?.length) return 0;
 const admin = createAdminClient(); let remaining = data.length;
 for (const { photo_path: path } of data) {
  if (!path.startsWith(`${userId}/`)) continue;
  const removed = await admin.storage.from("caption-photos").remove([path]);
  if (!removed.error) {
   const marked = await client.rpc("caption_cleanup_done", { p_photo_path: path });
   if (!marked.error) remaining--;
  }
 }
 return remaining;
}
