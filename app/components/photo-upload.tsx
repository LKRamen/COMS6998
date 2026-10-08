"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { captionStyles } from "../../lib/caption-input";
import type { CaptionInputs } from "../../lib/caption-input";
export default function PhotoUpload({ momentId, inputs }: { momentId?: string; inputs?: CaptionInputs }) {
 const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
 async function upload(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setPending(true); setError("");
  try {
   const form = new FormData(event.currentTarget); const photo = form.get("photo");
   if (!(photo instanceof File) || !photo.size || photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) throw new Error("Choose a JPEG, PNG or WebP photo under 5 MiB.");
   // Downsize before the request so accepted source photos fit hosted request limits.
   const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
   try {
    if (bitmap.width * bitmap.height > 20_000_000) throw new Error("Choose a photo under 20 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("This photo could not be prepared. Try another browser.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const prepared = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!prepared || prepared.size > 3 * 1024 * 1024) throw new Error("This photo could not be resized. Please choose a smaller photo.");
    form.set("photo", new File([prepared], "travel-photo.jpg", { type: "image/jpeg" }));
   } finally { bitmap.close(); }
   const response = await fetch("/api/caption-photo", { method: "POST", body: form }); const result = await response.json();
   if (!response.ok) throw new Error(result.error ?? "Photo upload failed.");
   router.push(`/creations/${result.id}`); router.refresh();
  } catch (error) { setError(error instanceof Error ? error.message : "Upload failed. Please try again."); } finally { setPending(false); }
 }
 return <form className="profile-form" onSubmit={upload}>
  {momentId && <input type="hidden" name="moment_id" value={momentId}/>}
  <label>{momentId ? "Replace this photo" : "Your travel photo"}<input required name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending}/></label>
  <p className="field-help">One JPEG, PNG or WebP under 5 MiB. Location metadata is removed.</p>
  <label>Where was this? <span className="optional">Optional</span><input name="location" maxLength={120} placeholder="Central Park, NYC" defaultValue={inputs?.location} disabled={pending}/></label>
  <label>The story behind it <span className="optional">Optional</span><textarea name="context" maxLength={500} rows={3} placeholder="A small discovery, a long journey, or a moment worth remembering." defaultValue={inputs?.context} disabled={pending}/></label>
  <label>Caption style<select name="style" defaultValue={inputs?.style ?? "Funny"} disabled={pending}>{captionStyles.map(style => <option key={style}>{style}</option>)}</select></label>
  <p className="privacy-note">When you generate captions, your photo and context are sent to Google Gemini. On its free tier, Google may use this content to improve its products. Drafts and unselected captions stay private to you.</p>
  {momentId && <p className="field-help">Replacing the photo clears your selection. Earlier captions remain in history.</p>}
  <button className="button" disabled={pending}>{pending ? "Saving your photo…" : momentId ? "Replace photo" : "Save photo & start drafting"}</button>
  {error && <p className="form-message" role="alert">{error}</p>}
 </form>;
}
