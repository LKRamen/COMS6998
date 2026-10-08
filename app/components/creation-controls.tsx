"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cleanupPhotos, deleteCreation } from "../creations/actions";
export default function CreationControls({ id }: { id?: string }) {
 const router = useRouter(); const [confirming, setConfirming] = useState(false); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
 async function remove() {
  setPending(true);
  try { const result = id ? await deleteCreation(id) : await cleanupPhotos(); setMessage(result.ok ? result.message ?? "Removed." : result.error); if (result.ok && id) { router.push("/creations"); router.refresh(); } }
  catch { setMessage("That action could not be completed. Please try again."); } finally { setPending(false); }
 }
 return <div className="creation-controls">{id ? confirming ? <><p>Delete this creation and its saved captions? This cannot be undone.</p><button className="text-button" disabled={pending} onClick={remove}>Confirm deletion</button> <button className="text-button" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button></> : <button className="text-button" onClick={() => setConfirming(true)}>Delete creation</button> : <button className="text-button" disabled={pending} onClick={remove}>Retry pending photo cleanup</button>}{message && <p role="status">{message}</p>}</div>;
}
