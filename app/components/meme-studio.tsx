"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { FloppyDisk } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import type { Moment, Allowance } from "../../lib/captions";
import { captionStyles, parseInputs, type CaptionInputs } from "../../lib/caption-input";
import { saveDraft, generateBatch } from "../creations/actions";
import { publishMeme, saveMemeCaption } from "../brainrot/actions";
import MemeMedia from "./meme-media";
import StudioUpload from "./studio-upload";
function subscribeBackup(listener: () => void) { window.addEventListener("brainrot-draft-backup", listener); return () => window.removeEventListener("brainrot-draft-backup", listener); }
export default function MemeStudio({ moment, allowance }: { moment: Moment; allowance: Allowance }) {
 const router = useRouter();
 const [inputs, setInputs] = useState<CaptionInputs>({ context: moment.context, location: moment.location, style: moment.style });
 const [selected, setSelected] = useState(moment.selected_caption_id), [text, setText] = useState(moment.caption_override || moment.captions.find(c => c.id === moment.selected_caption_id)?.text || "");
 const [pending, setPending] = useState<"generate" | "publish" | "save" | null>(null), [error, setError] = useState(""), [message, setMessage] = useState("");
 const busy = useRef(false), dirty = useRef(false);
 const [autosaving, setAutosaving] = useState(false);
 const latestDraft = useRef({ inputs, selected, text });
 const savedSnapshot = useRef(JSON.stringify({ inputs, selected, text }));
 const saving = useRef<Promise<void>>(Promise.resolve());
 const alive = useRef(true);
 const backupKey = `brainrot:draft:${moment.id}:${moment.photo_revision}`;
 const backup = useSyncExternalStore(subscribeBackup, () => { try { return sessionStorage.getItem(backupKey); } catch { return null; } }, () => null);
 function clearBackup() { try { sessionStorage.removeItem(backupKey); window.dispatchEvent(new Event("brainrot-draft-backup")); } catch { /* Server saving remains available when browser storage is disabled. */ } }
 const validRuns = moment.runs.filter(run => run.photo_revision === moment.photo_revision), latest = validRuns[0];
 const candidates = moment.captions.filter(c => c.generation_run_id === latest?.id);
 useEffect(() => {
  const warn = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
  window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
 }, []);
 useEffect(() => {
  latestDraft.current = { inputs, selected, text };
  const snapshot = JSON.stringify({ inputs, selected, text });
  if (!dirty.current && snapshot === savedSnapshot.current) return;
  try { sessionStorage.setItem(backupKey, snapshot); window.dispatchEvent(new Event("brainrot-draft-backup")); } catch { /* Fall back to server saving and the unload warning. */ }
  let timer: ReturnType<typeof setTimeout>; let cancelled = false;
  const save = () => {
   if (cancelled) return;
   if (!dirty.current && snapshot === savedSnapshot.current) return;
   if (busy.current) { timer = setTimeout(save, 250); return; }
   const draft = { inputs, selected, text };
   setAutosaving(true);
   saving.current = saving.current.catch(() => {}).then(async () => {
    const result = await saveDraft(moment.id, draft.inputs, draft.selected, moment.photo_revision);
    if (!result.ok) throw new Error(result.error);
    if (draft.selected) { const caption = await saveMemeCaption(moment.id, draft.selected, draft.text); if (!caption.ok) throw new Error(caption.error); }
    savedSnapshot.current = snapshot;
    if (JSON.stringify(latestDraft.current) === snapshot) { dirty.current = false; try { sessionStorage.removeItem(backupKey); window.dispatchEvent(new Event("brainrot-draft-backup")); } catch {} }
   });
   void saving.current.then(() => { if (!cancelled) setMessage("Draft saved automatically."); }).catch(() => { if (!cancelled) setError("Automatic saving failed. Use Save draft to retry. Your edits are still here."); }).finally(() => { if (alive.current) setAutosaving(false); });
  };
  timer = setTimeout(save, 1200);
  return () => { cancelled = true; clearTimeout(timer); };
 }, [inputs, selected, text, moment.id, moment.photo_revision, backupKey]);
 useEffect(() => {
  alive.current = true;
  return () => {
   alive.current = false;
   if (!dirty.current) return;
   const draft = latestDraft.current;
   // Flush the last edited snapshot on in-app navigation; serialize it after any save in flight.
   void saving.current.catch(() => {}).then(async () => {
    const result = await saveDraft(moment.id, draft.inputs, draft.selected, moment.photo_revision);
    if (result.ok && draft.selected) await saveMemeCaption(moment.id, draft.selected, draft.text);
   }).catch(() => { /* The local backup remains available on the next visit. */ });
  };
 }, [moment.id, moment.photo_revision]);
 async function persist(caption = selected, captionText = text) {
  await saving.current.catch(() => {});
  const saved = await saveDraft(moment.id, inputs, caption, moment.photo_revision); if (!saved.ok) throw new Error(saved.error);
  if (caption) { const edited = await saveMemeCaption(moment.id, caption, captionText); if (!edited.ok) throw new Error(edited.error); }
  dirty.current = false; savedSnapshot.current = JSON.stringify({ inputs, selected: caption, text: captionText }); clearBackup();
 }
 function restoreBackup() {
  try {
   const stored = JSON.parse(backup ?? "null"); const restored = parseInputs(stored.inputs);
   if (typeof stored.text !== "string" || stored.text.length > 240 || (stored.selected !== null && !moment.captions.some(c => c.id === stored.selected && validRuns.some(r => r.id === c.generation_run_id)))) throw new Error("invalid");
   dirty.current = true; setInputs(restored); setSelected(stored.selected); setText(stored.text); setMessage("Local edits restored. Saving your draft…");
  } catch { setError("This local backup no longer matches your photo. Discard it and continue with the saved draft."); }
 }
 async function act(kind: "generate" | "publish" | "save") {
  if (busy.current) return; busy.current = true; setPending(kind); setError(""); setMessage("");
  try {
   await persist();
   if (kind === "generate") { const result = await generateBatch(moment.id, crypto.randomUUID()); if (!result.ok) throw new Error(result.error); setMessage("Three fresh takes. Pick the one that gets you."); router.refresh(); }
   if (kind === "publish") { if (!selected) throw new Error("Choose a generated caption first."); const result = await publishMeme(moment.id, selected, text); if (!result.ok) throw new Error(result.error); router.push(`/meme/${result.id}?published=1`); router.refresh(); }
   if (kind === "save") setMessage("Draft saved. Pick it up anytime in My creations.");
  } catch (error) { setError(error instanceof Error ? error.message : "Something went wrong. Your saved draft is safe."); }
  finally { busy.current = false; setPending(null); }
 }
 async function choose(id: string, caption: string) {
  if (busy.current) return; setSelected(id); setText(caption); dirty.current = true;
  busy.current = true; setPending("save"); setError("");
  try { await persist(id, caption); setMessage("Selection saved."); }
  catch (error) { setError(error instanceof Error ? error.message : "Your selection couldn’t be saved. Try Save draft."); }
  finally { busy.current = false; setPending(null); }
 }
 return <div className="studio-workspace"><section className="studio-preview"><div className="preview-label"><span>YOUR MEME PREVIEW</span><span>PRIVATE DRAFT</span></div><MemeMedia src={moment.photo_url} caption={text || "Your next good bad idea goes here."} eager/>
  <details className="private-history"><summary>Replace source image</summary><p className="studio-note">Replacing the image clears your selection. Earlier captions remain in private history.</p><StudioUpload momentId={moment.id}/></details>
 </section><section>{backup && backup !== JSON.stringify({ inputs, selected, text }) && <div className="form-message"><p>Unsaved edits from this tab are available.</p><div className="studio-button-row"><button className="secondary-button" onClick={restoreBackup} disabled={Boolean(pending)}>Restore local draft</button><button className="secondary-button" onClick={clearBackup}>Discard local backup</button></div></div>}<div className="studio-fields"><label>The context <span>What’s the lore?</span><textarea value={inputs.context} maxLength={500} rows={3} disabled={Boolean(pending)} onChange={event => { dirty.current = true; setInputs({ ...inputs, context: event.target.value }); }}/></label><div><p className="studio-caption-label">Pick your flavor</p><div className="style-options" role="group" aria-label="Humor style">{captionStyles.slice(0, 7).map(style => <button key={style} type="button" aria-pressed={inputs.style === style} disabled={Boolean(pending)} onClick={() => { dirty.current = true; setInputs({ ...inputs, style }); }}>{style}</button>)}</div></div><button className="button" disabled={Boolean(pending) || allowance.remaining === 0} onClick={() => void act("generate")}>{pending === "generate" ? "Letting AI cook…" : latest ? "Generate three more" : "Generate captions"}{latest ? <ArrowClockwise size={18}/> : <Sparkle size={18} weight="fill"/>}</button><p className="studio-note">{allowance.remaining} of 5 daily batches left. Resets {new Date(allowance.reset_at).toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })} Eastern. Failed generations don’t use a batch.</p></div>
  {pending === "generate" && <div className="generation-indicator" role="status"><Sparkle size={19}/>Finding the joke in your photo. Your draft is saved.</div>}{error && <p className="form-message" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}
  {candidates.length > 0 && <section className="studio-candidates"><h2>Three takes. Your call.</h2>{candidates.map((caption, index) => <button key={caption.id} className="meme-choice" aria-pressed={selected === caption.id} disabled={Boolean(pending)} onClick={() => void choose(caption.id, caption.text)}><span>{selected === caption.id ? <Check size={12}/> : index + 1}</span><span>{caption.text}</span></button>)}</section>}
  {selected && <section className="studio-publish"><label className="studio-caption-label">Make it yours <span>Edit your selected AI caption. {text.length}/240 characters.</span><textarea value={text} maxLength={240} rows={3} disabled={Boolean(pending)} onChange={event => { dirty.current = true; setText(event.target.value); }}/></label><div className="studio-button-row"><button className="secondary-button" disabled={Boolean(pending)} onClick={() => void act("save")}><FloppyDisk size={16}/>{pending === "save" ? "Saving…" : "Save draft"}</button><button className="button" disabled={Boolean(pending) || !text.trim()} onClick={() => void act("publish")}>{pending === "publish" ? "Making it official…" : "Publish meme"}<ArrowUpRight size={18}/></button></div><p className="studio-note">Publishing makes your meme and creator name public. The caption stays fixed once people can vote. Your prompts and unselected captions stay private.</p></section>}
  {!selected && <p><button className="secondary-button" disabled={Boolean(pending)} onClick={() => void act("save")}><FloppyDisk size={16}/>Save draft</button></p>}
  {autosaving && <p className="studio-note" role="status">Saving your draft…</p>}
  <details className="private-history"><summary>Private generation history & prompts · {moment.runs.length} batches</summary>{moment.runs.map(run => <section key={run.id}><h3>{run.style} · {run.model}</h3>{run.photo_revision !== moment.photo_revision && <p>Generated for an earlier image.</p>}{moment.captions.filter(c => c.generation_run_id === run.id).map(c => <p key={c.id}>{c.text}{run.photo_revision === moment.photo_revision && <button className="text-button" disabled={Boolean(pending)} onClick={() => void choose(c.id, c.text)}>Use this caption</button>}</p>)}<pre>{run.system_prompt}</pre><pre>{run.user_prompt}</pre></section>)}</details>
  <p className="studio-note" style={{ marginTop: 24 }}>Generation sends your image and context to Google Gemini. Free-tier content may be used to improve Google products. Your draft stays saved if generation fails.</p>
 </section></div>;
}
