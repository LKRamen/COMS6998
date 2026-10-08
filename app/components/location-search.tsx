"use client";
import { useId, useRef, useState } from "react";
import { countries } from "../../lib/countries";
import type { SelectedLocation } from "../../lib/locations";

export default function LocationSearch({ value, query, onChange, onQueryChange, disabled = false }: {
 value: SelectedLocation | null; query: string; onChange: (location: SelectedLocation | null) => void;
 onQueryChange: (query: string) => void; disabled?: boolean;
}) {
 const id = useId(); const request = useRef(0);
 const [results, setResults] = useState<SelectedLocation[]>([]); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
 function edit(text: string) { request.current++; setPending(false); setResults([]); setMessage(""); onChange(null); onQueryChange(text); }
 function select(location: SelectedLocation) { request.current++; setPending(false); setResults([]); setMessage(""); onQueryChange(location.label); onChange(location); }
 async function search() {
  const term = query.trim(); if (term.length < 3 || term.length > 80 || pending) return;
  const current = ++request.current; setPending(true); setMessage(""); setResults([]);
  try {
   const response = await fetch(`/api/locations?q=${encodeURIComponent(term)}`); const data = await response.json();
   if (current !== request.current) return;
   if (!response.ok) throw new Error(data.error ?? "Place search is unavailable.");
   setResults(data.results ?? []); setMessage(data.error ?? (data.results?.length ? "Select a matching place below." : "No matching places. Try a different name or choose a country."));
  } catch { if (current === request.current) setMessage("Place search is unavailable. You can still choose a country below."); }
  finally { if (current === request.current) setPending(false); }
 }
 return <div className="location-search">
  <label htmlFor={`${id}-query`}>Where was this? <span className="optional">Required to publish</span></label>
  <div className="location-search-row"><input id={`${id}-query`} maxLength={120} value={query} disabled={disabled} placeholder="Central Park, New York, or Japan" onChange={event => edit(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void search(); } }}/><button type="button" className="text-button" disabled={disabled || pending || query.trim().length < 3 || query.trim().length > 80} onClick={search}>{pending ? "Searching…" : "Search places"}</button></div>
  {value && <p className="field-help" role="status">Selected: {value.label} · {countries.find(country => country.code === value.country_code)?.name}</p>}
  {message && <p className="field-help" role="status">{message}</p>}
  {results.length > 0 && <ul className="location-results" aria-label="Matching places">{results.map((location, index) => <li key={`${location.country_code}-${location.label}-${index}`}><button type="button" disabled={disabled} onClick={() => select(location)}>{location.label}</button></li>)}</ul>}
  <label htmlFor={`${id}-country`}>Or choose a country or territory<select id={`${id}-country`} disabled={disabled} value={value?.country_code ?? ""} onChange={event => { const country = countries.find(item => item.code === event.target.value); if (country) select({ label: country.name, country_code: country.code }); else edit(""); }}><option value="">Choose a country</option>{countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
  <p className="field-help">Place searches send the words you enter to Photon. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Choosing a country works without a place search.</p>
  <p className="field-help">A place, city, or country is enough. Select a result to put your published post on the map.</p>
 </div>;
}
