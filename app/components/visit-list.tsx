"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { countries } from "../../lib/countries";
import { addVisit, removeVisit } from "../members/actions";
function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="button" disabled={pending}>{pending ? "Adding…" : "Add to my travels"}</button>;
}
function RemoveButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return <button className="remove-visit" disabled={pending} aria-label={`Remove ${name} from my travels`}>{pending ? "Removing…" : "Remove"}</button>;
}
export default function VisitList({ visited }: { visited: string[] }) {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState("");
  const visitedSet = new Set(visited);
  const available = countries.filter(country => !visitedSet.has(country.code) && country.name.toLowerCase().includes(search.trim().toLowerCase()));
  const personal = countries.filter(country => visitedSet.has(country.code));
  return <div className="travel-ledger">
    <section className="add-country" aria-labelledby="add-country-title"><p className="eyebrow">THE NEXT ENTRY</p><h2 id="add-country-title">Where have you been?</h2><p>Every place has a story. Add a country to your map.</p>
      <label htmlFor="country-search">Find a country or territory</label><input id="country-search" type="search" placeholder="Search countries…" value={search} onChange={event => { setSearch(event.target.value); setSelection(""); }} />
      <form action={addVisit}>
        <label htmlFor="country-select">Country or territory</label><select id="country-select" name="country_code" value={selection} onChange={event => setSelection(event.target.value)} required>
          <option value="">{available.length ? "Choose a country" : "No matching unvisited countries"}</option>
          {available.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
        </select><SaveButton />
      </form><p className="privacy-note">Your visits contribute to anonymous country counts on the community map. Your personal list is only visible to you.</p>
    </section>
    <section className="country-ledger" aria-labelledby="visited-title"><div className="ledger-heading"><h2 id="visited-title">Your countries</h2><span>{personal.length.toString().padStart(2,"0")} entries</span></div>
      {personal.length ? <ol>{personal.map((country, index) => <li key={country.code}><span className="ledger-index">{(index+1).toString().padStart(2,"0")}</span><span>{country.name}</span><form action={removeVisit}><input type="hidden" name="country_code" value={country.code}/><RemoveButton name={country.name}/></form></li>)}</ol> : <div className="ledger-empty"><h3>Your first country is a good place to start.</h3><p>Pick a country you’ve visited. It will appear here and on your map.</p></div>}
    </section>
  </div>;
}
