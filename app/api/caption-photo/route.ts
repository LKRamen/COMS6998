import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { isProfileComplete, readProfile } from "../../../lib/auth";
import { normalizePhoto } from "../../../lib/caption-photo";
import { isUuid, parseInputs } from "../../../lib/caption-input";
import { parseLocation } from "../../../lib/locations";
import { isSameOriginRequest } from "../../../lib/request-origin";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
 if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Please submit from this website." }, { status: 403 });
 const client = await createClient();
 const { data: { user } } = await client.auth.getUser();
 if (!user) return NextResponse.json({ error: "Sign in to upload a photo." }, { status: 401 });
 try {
  if (!isProfileComplete(await readProfile(client, user.id))) return NextResponse.json({ error: "Complete your profile before creating a post." }, { status: 403 });
  const limit = 5 * 1024 * 1024 + 16 * 1024;
  if (Number(request.headers.get("content-length")) > limit) return NextResponse.json({ error: "Choose a photo under 5 MiB." }, { status: 413 });
  const reader = request.body?.getReader(); if (!reader) throw new Error("Choose a photo.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
   const { done, value } = await reader.read(); if (done) break;
   size += value.length;
   if (size > limit) { await reader.cancel(); return NextResponse.json({ error: "Choose a photo under 5 MiB." }, { status: 413 }); }
   chunks.push(value);
  }
  const form = await new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
  const photo = form.get("photo"); if (!(photo instanceof File)) throw new Error("Choose a photo.");
  const inputs = parseInputs({ context: form.get("context"), location: form.get("location"), style: form.get("style") });
  const country = form.get("country_code");
  const selectedLocation = country ? parseLocation({ label: inputs.location, country_code: country }) : null;
  const replacing = form.get("moment_id");
  if (replacing) {
   if (!isUuid(replacing)) throw new Error("Draft is unavailable.");
   const existing = await client.from("moments").select("photo_path,status").eq("id", replacing).maybeSingle();
   if (existing.error || !existing.data || existing.data.status !== "draft") throw new Error("Draft is unavailable.");
  }
  const bytes = await normalizePhoto(photo); const admin = createAdminClient();
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const upload = await admin.storage.from("caption-photos").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (upload.error) throw new Error("Your photo could not be uploaded. Please try again.");
  const value = { creator_id: user.id, photo_path: path, photo_revision: crypto.randomUUID(), ...inputs, country_code: selectedLocation?.country_code ?? null, selected_caption_id: null };
  const saved = replacing
   ? await admin.rpc("caption_replace_photo_location", { p_user_id: user.id, p_moment_id: replacing, p_photo_path: path, p_context: inputs.context, p_location: inputs.location, p_style: inputs.style, p_country_code: selectedLocation?.country_code ?? null })
   : await admin.from("moments").insert(value).select("id").single();
  if (saved.error || !saved.data) {
   const removal = await admin.storage.from("caption-photos").remove([path]);
   if (removal.error) await admin.from("photo_cleanup_requests").insert({ creator_id: user.id, photo_path: path });
   throw new Error("Your draft could not be saved. Please try again.");
  }
  return NextResponse.json({ id: replacing ? saved.data : saved.data.id }, { headers: { "Cache-Control": "no-store" } });
 } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Photo upload failed. Please try again." }, { status: 400 }); }
}
