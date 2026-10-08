/* eslint-disable @next/next/no-img-element -- Short-lived signed images must not enter an image optimization cache. */
import Link from "next/link";
import { requireCompleteProfile } from "../../lib/auth";
import { getCreations } from "../../lib/captions";
import TravelNav from "../components/travel-nav";
import CreationControls from "../components/creation-controls";
export default async function Creations() {
 const { supabase } = await requireCompleteProfile(); let failed = false; let rows: Awaited<ReturnType<typeof getCreations>> = [];
 try { rows = await getCreations(supabase); } catch { failed = true; }
 return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn current="creations"/><header className="caption-heading"><div><p className="eyebrow">YOUR PHOTOS, YOUR WORDS</p><h1>My creations<span>.</span></h1><p className="page-intro">Pick up a draft or revisit a moment you’ve shared.</p></div><Link className="button" href="/create">Create captions ↗</Link></header>
  {failed ? <p className="form-message" role="alert">Your creations couldn’t be loaded. Please try again.</p> : !rows.length ? <section className="feed-empty"><h2>Your next story starts with a photo.</h2><Link href="/create">Start a creation ↗</Link></section> : <section className="creation-grid">{rows.map(row => <article className="creation-card" key={row.id}>
   {row.photo_url && <img src={row.photo_url} alt={row.location ? `Your photo from ${row.location}` : "Your travel photo"}/>}
   <div><p className="eyebrow">{row.status === "draft" ? "PRIVATE DRAFT" : "PUBLISHED"}</p><h2>{row.location || "Somewhere worth remembering"}</h2><Link href={`/creations/${row.id}`}>{row.status === "draft" ? "Continue drafting" : "View saved captions"} ↗</Link><CreationControls id={row.id}/></div>
  </article>)}</section>}<CreationControls/>
 </div></main>;
}
