/* eslint-disable @next/next/no-img-element -- Private short-lived signed images must not enter an image optimization cache. */
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Allowance, Moment } from "../../lib/captions";
import { captionStyles, type CaptionInputs } from "../../lib/caption-input";
import { generateBatch, publishCaption, saveDraft, savePostLocation } from "../creations/actions";
import CreationControls from "./creation-controls";
import LocationSearch from "./location-search";
import type { SelectedLocation } from "../../lib/locations";
import PhotoUpload from "./photo-upload";
export default function CaptionDraft({ moment, firstName }: { moment: Moment; allowance?: Allowance; firstName: string }) {
 const router = useRouter(); const [inputs, setInputs] = useState<CaptionInputs>({ context: moment.context, location: moment.location, style: moment.style });
 const [selected, setSelected] = useState(moment.selected_caption_id); const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
 const [location, setLocation] = useState<SelectedLocation | null>(moment.country_code ? { label: moment.location, country_code: moment.country_code } : null);
 const [savedLocation, setSavedLocation] = useState(moment.country_code ? JSON.stringify({ label: moment.location, country_code: moment.country_code }) : "");
 const candidate = moment.captions.find(c => c.id === selected);
 const selectedRun = moment.runs.find(r => r.id === candidate?.generation_run_id);
 const eligible = selectedRun?.photo_revision === moment.photo_revision;
 const [savedInputs, setSavedInputs] = useState(JSON.stringify(inputs)); const autosaving = useRef(false);
 useEffect(() => {
  const snapshot = JSON.stringify(inputs);
  if ((snapshot === savedInputs && (location ? JSON.stringify(location) : "") === savedLocation) || pending) return;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout>;
  const persist = async () => {
   if (cancelled) return;
   if (autosaving.current) { timer = setTimeout(persist, 250); return; }
   autosaving.current = true;
   try { if (!location) { const cleared = await savePostLocation(moment.id, null); if (!cleared.ok) { setError(cleared.error); return; } } const result = await saveDraft(moment.id, inputs, selected); if (result.ok && location) { const saved = await savePostLocation(moment.id, location); if (!saved.ok) { setError(saved.error); return; } } if (result.ok) { setSavedInputs(snapshot); setSavedLocation(location ? JSON.stringify(location) : ""); setMessage("Draft saved."); } else setError(result.error); }
   catch { setError("Automatic saving failed. Use Save draft to try again."); }
   finally { autosaving.current = false; }
  };
  timer = setTimeout(persist, 1000);
  return () => { cancelled = true; clearTimeout(timer); };
 }, [inputs, selected, moment.id, pending, savedInputs, location, savedLocation]);
 async function act(kind: "save" | "generate" | "publish") {
  if (pending) return; setPending(true); setError(""); setMessage("");
  try {
   if (autosaving.current) throw new Error("Your draft is saving. Please try again in a moment.");
   if (!location) { const cleared = await savePostLocation(moment.id, null); if (!cleared.ok) throw new Error(cleared.error); setSavedLocation(""); }
   const saved = await saveDraft(moment.id, inputs, selected); if (!saved.ok) throw new Error(saved.error); setSavedInputs(JSON.stringify(inputs));
   if (location) { const placed = await savePostLocation(moment.id, location); if (!placed.ok) throw new Error(placed.error); setSavedLocation(JSON.stringify(location)); }
   if (kind === "publish" && !location) throw new Error("Select a location before publishing.");
   const result = kind === "generate" ? await generateBatch(moment.id, crypto.randomUUID()) : kind === "publish" && selected ? await publishCaption(moment.id, selected) : saved;
   if (!result.ok) throw new Error(result.error);
   setMessage(result.message ?? "Post published.");
   if (kind === "publish") router.push("/"); router.refresh();
  } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); router.refresh(); } finally { setPending(false); }
 }
 async function select(id: string) {
  if (autosaving.current) { setError("Your draft is saving. Please select again in a moment."); return; }
  setSelected(id); setPending(true); setError("");
  try { if (!location) { const cleared = await savePostLocation(moment.id, null); if (!cleared.ok) throw new Error(cleared.error); } const result = await saveDraft(moment.id, inputs, id); if (!result.ok) { setError(result.error); setSelected(moment.selected_caption_id); } else { if (location) { const placed = await savePostLocation(moment.id, location); if (!placed.ok) throw new Error(placed.error); } setSavedInputs(JSON.stringify(inputs)); setSavedLocation(location ? JSON.stringify(location) : ""); setMessage("Selection saved."); } }
  catch { setError("Your selection could not be saved."); } finally { setPending(false); }
 }
 return <div className="draft-layout"><section className="draft-photo">
  {moment.photo_url ? <img src={moment.photo_url} alt={moment.location ? `Travel photo from ${moment.location}` : "Your travel photo"}/> : <p>Photo unavailable. Refresh to renew access.</p>}
  <details><summary>Replace photo</summary><PhotoUpload momentId={moment.id} inputs={inputs} selectedLocation={location}/></details>
  <CreationControls id={moment.id}/>
 </section><section className="draft-editor">
  <div className="profile-form"><LocationSearch value={location} query={inputs.location} onChange={setLocation} onQueryChange={value => setInputs(current => ({ ...current, location: value }))} disabled={pending}/>
  <label>The story behind it <span className="optional">Optional</span><textarea maxLength={500} rows={3} disabled={pending} value={inputs.context} onChange={e => setInputs({ ...inputs, context: e.target.value })}/></label>
  <label>Caption style<select disabled={pending} value={inputs.style} onChange={e => setInputs({ ...inputs, style: e.target.value as CaptionInputs["style"] })}>{captionStyles.map(style => <option key={style}>{style}</option>)}</select></label></div>
  <div className="draft-actions"><button className="text-button" disabled={pending} onClick={() => act("save")}>Save draft</button><button className="button" disabled={pending} onClick={() => act("generate")}>{pending ? "Working…" : moment.runs.length ? "Generate three more" : "Generate three captions"}</button></div>
  <p className="muted">Gemini reads your photo. No daily generation cap.</p>
  <p className="privacy-note">Generation sends this photo and context to Google Gemini. Free-tier content may be used to improve Google products. Saved prompts and earlier captions are private to you.</p>
  {error && <p className="form-message" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}
  <div className="caption-batches">{moment.runs.map((run, index) => <section key={run.id} className="caption-batch"><h2>{index === 0 ? "Latest captions" : "Earlier batch"} <span>{run.style}{run.location ? ` · ${run.location}` : ""}</span></h2>
   {run.photo_revision !== moment.photo_revision && <p className="muted">Generated for an earlier photo; cannot be published with this one.</p>}
   {moment.captions.filter(c => c.generation_run_id === run.id).map(c => <button key={c.id} className="caption-choice" aria-pressed={selected === c.id} disabled={pending || run.photo_revision !== moment.photo_revision} onClick={() => select(c.id)}>{c.text}<span>{selected === c.id ? "Selected ✓" : "Select caption"}</span></button>)}
   <details><summary>Saved prompt & model</summary><p className="muted">{run.model}</p><pre>{run.system_prompt}</pre><pre>{run.user_prompt}</pre></details>
  </section>)}</div>
  {candidate && eligible && <section className="publication-preview"><p className="eyebrow">PUBLIC CAPTION PREVIEW</p><p className="preview-caption">{candidate.text}</p><p className="muted">By {firstName} · {selectedRun?.style}{location ? ` · ${location.label}` : " · Select a location"}</p><p className="muted">Publishing adds this location to your personal map and the community atlas. You can correct the location later; the caption stays fixed.</p><button className="button" disabled={pending || !location || JSON.stringify(location) !== savedLocation} onClick={() => act("publish")}>Publish selected caption</button></section>}
 </section></div>;
}
