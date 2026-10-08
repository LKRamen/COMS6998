import { requireCompleteProfile } from "../../lib/auth";
import { getMyVisits } from "../../lib/travel";
import WorldMap from "../components/world-map";
import TravelNav from "../components/travel-nav";
import Link from "next/link";

export default async function Members() {
  const { supabase, user, profile } = await requireCompleteProfile();
  const visits = await getMyVisits(supabase, user.id);
  return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn current="personal"/>
    <header className="travel-heading"><div><p className="eyebrow">{profile.first_name}’S POST LOCATIONS</p><h1>Your world,<br/><span>so far.</span></h1><p className="page-intro">Every published photo adds its country to your map.<br/>Share a moment from somewhere you’ve been.</p></div><div className="travel-stat"><strong>{visits.length.toString().padStart(2,"0")}</strong><span>countries &amp; territories in your posts</span><small>Updates automatically when you publish</small></div></header>
    <WorldMap personal counts={visits.map(code => ({country_code:code, visitor_count:1}))}/>
    <section className="map-invitation"><h2>{visits.length ? "Keep your story growing." : "Your first post puts you on the map."}</h2><p>Drafts stay private. Published posts build your map and our shared atlas. Correct a location or remove a post from My creations.</p><div className="draft-actions"><Link className="button" href="/create">Share a photo</Link><Link href="/creations">My creations</Link></div></section>
    <footer className="travel-footer"><span>Your personal map. Our collective world.</span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Map data: Natural Earth</a><span>Countries &amp; territories · illustrative boundaries</span></footer>
  </div></main>;
}