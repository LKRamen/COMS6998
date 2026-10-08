"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SelectedLocation } from "../../lib/locations";
import { savePostLocation } from "../creations/actions";
import LocationSearch from "./location-search";
export default function PublishedLocationEditor({ id, location }: { id: string; location: SelectedLocation | null }) {
 const router = useRouter(); const [value, setValue] = useState(location); const [query, setQuery] = useState(location?.label ?? ""); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
 async function save() {
  if (!value || pending) return; setPending(true); setMessage("");
  try { const result = await savePostLocation(id, value); if (!result.ok) throw new Error(result.error); setMessage("Location updated. Both maps are up to date."); router.refresh(); }
  catch (error) { setMessage(error instanceof Error ? error.message : "Location could not be saved."); }
  finally { setPending(false); }
 }
 return <details className="published-location-editor"><summary>Edit location</summary><div className="profile-form"><LocationSearch value={value} query={query} onChange={setValue} onQueryChange={setQuery} disabled={pending}/><button type="button" className="button" disabled={pending || !value} onClick={save}>{pending ? "Saving…" : "Save location"}</button><p className="field-help">Correcting the location updates your maps. Your photo, caption, and votes stay the same.</p>{message && <p role="status" className="form-message">{message}</p>}</div></details>;
}
