#!/usr/bin/env node
// Offline assistant-caption seeding. Never imported by the website.
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { normalizePhoto } from "../lib/caption-photo.ts";
import { renderMeme } from "../lib/meme-render.ts";
import { assertMatching, hash, readContainedImage, stableId, validateManifest } from "./bulk-import-input.mjs";

function checked(result, operation) {
 if (result.error) throw new Error(`${operation}: ${result.error.message}`);
 return result.data;
}
async function main() {
 const args = process.argv.slice(2), apply = args.includes("--apply");
 const manifestIndex = args.indexOf("--manifest");
 if (manifestIndex < 0 || !args[manifestIndex + 1] || args.some((arg, i) => !["--apply", "--manifest"].includes(arg) && i !== manifestIndex + 1)) throw new Error("Usage: node --conditions=react-server --env-file=.env scripts/bulk-import.mjs --manifest work/bulk-manifest.json [--apply]");
 const manifest = validateManifest(JSON.parse(await readFile(args[manifestIndex + 1], "utf8")));
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.supabase_project_url;
 const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.supabase_anon_key;
 const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !anon || !service) throw new Error("Existing Supabase environment configuration is required.");
 if (new URL(url).hostname !== "swmgfanscadzfkqoctle.supabase.co") throw new Error("Refusing to import into a different Supabase project.");
 const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
 const admin = createClient(url, service, options), storage = admin.storage.from("caption-photos");
 const accounts = new Map();
 for (const account of manifest.accounts) {
  const profile = checked(await admin.from("profiles").select("id,username,username_claimed,display_name").eq("id", account.id).single(), "Read account profile");
  assertMatching(profile, { id: account.id, username: account.username, username_claimed: true }, "Account profile");
  if (!profile.display_name?.trim()) throw new Error("Both owners must complete their display names first.");
  const { user } = checked(await admin.auth.admin.getUserById(account.id), "Read existing account");
  if (!user?.email || user.id !== account.id) throw new Error("Expected existing account has no usable email.");
  accounts.set(account.id, { email: user.email });
 }
 async function assetMatches(assetPath, bytes) {
  const split = assetPath.lastIndexOf("/"), parent = assetPath.slice(0, split), name = assetPath.slice(split + 1);
  const listed = checked(await storage.list(parent, { search: name, limit: 100 }), "Check existing media");
  if (!listed.some(file => file.name === name)) return false;
  const blob = checked(await storage.download(assetPath), "Verify existing media");
  if (hash(Buffer.from(await blob.arrayBuffer())) !== hash(bytes)) throw new Error("Existing media differs; refusing to replace it.");
  return true;
 }
 async function verifyRecords(item) {
  const moment = checked(await admin.from("moments").select("*").eq("id", item.moment.id).maybeSingle(), "Check existing meme");
  const run = checked(await admin.from("generation_runs").select("*").eq("id", item.run.id).maybeSingle(), "Check existing caption provenance");
  const captions = checked(await admin.from("captions").select("*").eq("generation_run_id", item.run.id), "Check existing captions");
  if (moment) {
   assertMatching(moment, item.moment, "Existing meme");
   if (!["draft", "published"].includes(moment.status)) throw new Error("Existing meme has an unexpected status.");
   if (moment.status === "published") assertMatching(moment, { selected_caption_id: item.selected.id, caption_override: item.selected.text, rendered_path: item.renderedPath }, "Published meme");
   else if (moment.selected_caption_id || moment.caption_override || moment.rendered_path) throw new Error("A person has edited this partial draft; refusing to overwrite it.");
  }
  if (run) {
   const { settings, ...fields } = item.run;
   assertMatching(run, fields, "Existing generation");
   assertMatching(run.settings, settings, "Existing generation provenance");
  }
  for (const caption of captions) {
   const expected = item.captions.find(expected => expected.id === caption.id);
   if (!expected) throw new Error("Unexpected captions already exist for this import.");
   assertMatching(caption, expected, "Existing caption");
  }
  if (moment?.status === "published" && (!run || captions.length !== 3)) throw new Error("Published import is missing its original provenance.");
  return { moment, run, captions };
 }
 // Validate every local file, font render, owner and existing record before any external write.
 const prepared = [], seen = new Set();
 for (const input of manifest.items) {
  const { bytes, mime } = await readContainedImage(manifest.folder, input.file);
  const originalHash = hash(bytes), id = stableId("meme", input.owner, originalHash);
  if (seen.has(id)) throw new Error("Duplicate image for the same owner in the manifest.");
  seen.add(id);
  const source = await normalizePhoto(new File([bytes], input.file, { type: mime }));
  const photoPath = `${input.owner}/${id}/bulk-source.jpg`, renderedPath = `${input.owner}/${id}/bulk-rendered.jpg`;
  const revision = stableId("photo", input.owner, originalHash), runId = stableId("run", input.owner, originalHash);
  const fingerprint = hash(JSON.stringify({ ...input, file: undefined, originalHash, normalizedHash: hash(source) }));
  const moment = { id, creator_id: input.owner, photo_path: photoPath, photo_revision: revision, context: "", style: input.style };
  const run = { id: runId, moment_id: id, creator_id: input.owner, photo_revision: revision, photo_path: photoPath, request_key: stableId("request", input.owner, originalHash), context: "", style: input.style,
   system_prompt: "One-time authorized Brainrot bulk import. Captions authored by an OpenAI assistant after inspecting the supplied image; no Gemini API request was made.",
   user_prompt: input.prompt, provider: "openai-assistant", model: input.model, prompt_version: "bulk-v1",
   settings: { import_version: "bulk-v1", original_image_sha256: originalHash, normalized_image_sha256: hash(source), content_fingerprint: fingerprint, provenance: input.provenance, selected_ordinal: input.selected } };
  const captions = input.captions.map((text, index) => ({ id: stableId(`caption-${index + 1}`, input.owner, originalHash), generation_run_id: runId, moment_id: id, creator_id: input.owner, ordinal: index + 1, text }));
  const selected = captions[input.selected - 1], rendered = await renderMeme(source, selected.text);
  const item = { input, moment, run, captions, selected, source, rendered, renderedPath };
  await verifyRecords(item); await assetMatches(photoPath, source); await assetMatches(renderedPath, rendered);
  prepared.push(item);
 }
 console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", validated: prepared.length, accounts: manifest.accounts.map(account => account.username) }));
 if (!apply) { console.log("Validated all images, owners, fonts and existing records. No changes made. Add --apply to publish."); return; }
 const sessions = new Map(), results = [];
 async function ownerClient(owner) {
  if (sessions.has(owner)) return sessions.get(owner);
  const { email } = accounts.get(owner);
  const link = checked(await admin.auth.admin.generateLink({ type: "magiclink", email }), "Create temporary owner session");
  const client = createClient(url, anon, options);
  const verified = checked(await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" }), "Authenticate import owner");
  if (verified.user?.id !== owner) throw new Error("Temporary session belongs to an unexpected account.");
  sessions.set(owner, client); return client;
 }
 async function upload(assetPath, bytes) {
  if (await assetMatches(assetPath, bytes)) return;
  const result = await storage.upload(assetPath, bytes, { contentType: "image/jpeg", upsert: false });
  if (result.error && !(await assetMatches(assetPath, bytes))) checked(result, "Upload import media");
 }
 try {
  for (const item of prepared) {
   try {
    const state = await verifyRecords(item);
    if (state.moment?.status === "published") {
     results.push({ id: item.moment.id, status: "already-published", url: `https://coms-6998-theta.vercel.app/meme/${item.moment.id}` }); continue;
    }
    const client = await ownerClient(item.input.owner);
    await upload(item.moment.photo_path, item.source);
    if (!state.moment) checked(await admin.from("moments").insert({ ...item.moment, status: "draft" }), "Save private import draft");
    if (!state.run) checked(await admin.from("generation_runs").insert(item.run), "Save caption provenance");
    const missing = item.captions.filter(caption => !state.captions.some(existing => existing.id === caption.id));
    if (missing.length) checked(await admin.from("captions").insert(missing), "Save caption candidates");
    await upload(item.renderedPath, item.rendered);
    checked(await client.rpc("brainrot_publish", { p_moment_id: item.moment.id, p_caption_id: item.selected.id, p_text: item.selected.text, p_rendered_path: item.renderedPath }), "Publish as owner");
    const verified = await verifyRecords(item);
    if (verified.moment?.status !== "published") throw new Error("Publication could not be confirmed; retry the unchanged manifest.");
    results.push({ id: item.moment.id, status: "published", url: `https://coms-6998-theta.vercel.app/meme/${item.moment.id}` });
   } catch (error) {
    results.push({ id: item.moment.id, status: "failed-private-state-preserved", error: error instanceof Error ? error.message : "Import failed" });
   }
  }
 } finally {
  for (const client of sessions.values()) await client.auth.signOut({ scope: "local" });
 }
 console.log(JSON.stringify({ results, published: results.filter(result => result.status === "published").length, reused: results.filter(result => result.status === "already-published").length, failed: results.filter(result => result.status === "failed-private-state-preserved").length }, null, 2));
 if (results.some(result => result.status === "failed-private-state-preserved")) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Bulk import failed."); process.exitCode = 1; });
