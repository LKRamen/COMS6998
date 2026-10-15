/* eslint-disable @next/next/no-img-element -- Private signed draft images must not enter shared image caches. */
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { requireCompleteProfile } from "../../lib/auth";
import { getCreations } from "../../lib/captions";
import AppShell from "../components/app-shell";
import CreationControls from "../components/creation-controls";
import { isCountryCode } from "../../lib/countries";
export default async function Creations({ searchParams }: { searchParams?: Promise<{ country?: string }> }) {
 const params = await searchParams ?? {}; const country = isCountryCode(params.country) ? params.country : undefined;
 const { supabase } = await requireCompleteProfile(); let failed = false; let rows: Awaited<ReturnType<typeof getCreations>> = [];
 try { rows = await getCreations(supabase, country); } catch { failed = true; }
 return <AppShell signedIn current="creations"><main><header className="section-heading"><div><p className="overline">YOUR PERSONAL NONSENSE ARCHIVE</p><h1>Works in <span>progress.</span></h1></div><Link className="button" href="/create">New meme <ArrowUpRight size={17}/></Link></header>
  {country && <p className="studio-note">Filtered by your travel map. <Link href="/creations">See all creations</Link></p>}
  {failed ? <p className="form-message" role="alert">Your creations couldn’t be loaded. Please try again.</p> : !rows.length ? <section className="state-panel"><h2>Your first masterpiece is pending.</h2><p>Save a draft, try some captions, and publish when it hits.</p><Link className="button" href="/create">Start creating</Link></section> : <section className="creation-grid" aria-label="Your creations">{rows.map(row => <article className="creation-card" key={row.id}>{row.photo_url && <img src={row.photo_url} alt={row.status === "draft" ? "Your private draft image" : "Source image for your published meme"} loading="lazy"/>}<div><p className="eyebrow">{row.status === "draft" ? "PRIVATE DRAFT" : "PUBLISHED"}</p><h2>{row.location || (row.status === "draft" ? "Something is cooking." : "Out in the world.")}</h2><Link href={`/creations/${row.id}`}>{row.status === "draft" ? "Open the studio" : "Private generation history"} ↗</Link>{row.status === "published" && <p><Link href={`/meme/${row.id}`}>View public meme ↗</Link></p>}<CreationControls id={row.id}/></div></article>)}</section>}<CreationControls/>
 </main></AppShell>;
}
