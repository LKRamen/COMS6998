/* eslint-disable @next/next/no-img-element -- Local object URLs provide immediate upload previews. */
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadSimple } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ImageSquare } from "@phosphor-icons/react/dist/csr/ImageSquare";
import { captionStyles, type CaptionStyle } from "../../lib/caption-input";
const styles = captionStyles.slice(0, 7);
export default function StudioUpload({ momentId }: { momentId?: string }) {
 const router = useRouter(), picker = useRef<HTMLInputElement>(null), busy = useRef(false);
 const [photo, setPhoto] = useState<File | null>(null), [preview, setPreview] = useState(""), [style, setStyle] = useState<CaptionStyle>("Brainrot");
 const [over, setOver] = useState(false), [pending, setPending] = useState(false), [status, setStatus] = useState(""), [error, setError] = useState("");
 useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
 function choose(file?: File) {
  if (!file || busy.current) return;
  if (!file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a still JPEG, PNG or WebP image under 5 MiB."); return; }
  setPhoto(file); setPreview(URL.createObjectURL(file)); setError("");
 }
 async function upload(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy.current) return;
  if (!photo) { setError("Choose an image first."); picker.current?.focus(); return; }
  busy.current = true; setPending(true); setError(""); setStatus("Preparing your image…");
  try {
   const form = new FormData(event.currentTarget); form.set("style", style); form.set("location", "");
   if (momentId) form.set("moment_id", momentId);
   const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
   try {
    if (bitmap.width * bitmap.height > 20_000_000) throw new Error("Choose an image under 20 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("Your browser couldn’t prepare this image. Please try another browser.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const bytes = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .86));
    if (!bytes || bytes.size > 3 * 1024 * 1024) throw new Error("Try a smaller image. This one couldn’t be prepared for upload.");
    form.set("photo", new File([bytes], "meme-source.jpg", { type: "image/jpeg" }));
   } finally { bitmap.close(); }
   setStatus("Saving your private draft…");
   const response = await fetch("/api/caption-photo", { method: "POST", body: form });
   const result = await response.json();
   if (!response.ok) throw new Error(result.error || "Upload failed. Your photo is still here; try again.");
   router.push(`/creations/${result.id}`); router.refresh();
  } catch (error) { setError(error instanceof Error ? error.message : "Upload failed. Your image and context are still here; try again."); }
  finally { busy.current = false; setPending(false); setStatus(""); }
 }
 return <form className="upload-layout" onSubmit={upload}>
  <div><div className={`drop-zone${over ? " is-over" : ""}${preview ? " has-photo" : ""}`} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={event => { event.preventDefault(); setOver(false); choose(event.dataTransfer.files[0]); }}>
   <input ref={picker} id={`studio-photo-${momentId ?? "new"}`} aria-label="Choose meme image" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={event => choose(event.target.files?.[0])}/>
   {preview ? <><img src={preview} alt="Your selected image preview"/><button type="button" className="replace-photo" disabled={pending} onClick={() => picker.current?.click()}>Choose another image</button></> : <><ImageSquare size={48} weight="duotone"/><h2>It starts with a photo.</h2><p>Drop your image here. We’ll bring the punchline.</p><button type="button" className="secondary-button" disabled={pending} onClick={() => picker.current?.click()}><UploadSimple size={17}/>Choose an image</button></>}
  </div><p className="studio-note" style={{ marginTop: 13 }}>JPEG, PNG or WebP · up to 5 MiB and 20 megapixels.<br/>Your photo stays private until you publish. Location metadata is removed.</p></div>
  <div className="studio-fields"><label>Extra context <span>Optional. Gemini reads the image itself.</span><textarea name="context" maxLength={500} rows={4} placeholder="Leave blank, or add an inside joke the photo can’t show…" disabled={pending}/></label><div><p className="studio-caption-label">Pick your flavor</p><div className="style-options" role="group" aria-label="Humor style">{styles.map(option => <button type="button" key={option} aria-pressed={style === option} disabled={pending} onClick={() => setStyle(option)}>{option}</button>)}</div></div>
   <p className="studio-note"><Sparkle size={13}/> No description needed. Next: Gemini looks at your photo and writes three captions.</p><button type="submit" className="button" disabled={pending}>{pending ? status : momentId ? "Save replacement image" : "Save photo & open studio"}<ArrowRight size={17}/></button>
   {pending && <div className="upload-status" role="status"><progress aria-label="Upload in progress"/>{status}</div>}{error && <p className="form-message" role="alert">{error}</p>}
   <p className="studio-note">When you generate, your image and context go to Google Gemini. Google’s free tier may use this content to improve its products. Private drafts and saved prompts are visible only to you.</p>
  </div>
 </form>;
}
