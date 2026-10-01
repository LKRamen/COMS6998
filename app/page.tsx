import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import { getCommunityVisits, type VisitCount } from "../lib/travel";
import { countries } from "../lib/countries";
import WorldMap from "./components/world-map";
import TravelNav from "./components/travel-nav";

export const dynamic = "force-dynamic";
export default async function Home() {
  let counts: VisitCount[] = [];
  let failed = false;
  let signedIn = false;
  try {
    const supabase = await createClient();
    const [visits, session] = await Promise.all([getCommunityVisits(), supabase.auth.getUser()]);
    counts = visits; signedIn = Boolean(session.data.user);
  } catch { failed = true; }
  const total = counts.reduce((sum,row) => sum + Number(row.visitor_count), 0);
  const ranked = counts.map(row => ({ ...row, name: countries.find(country => country.code === row.country_code)?.name ?? row.country_code }))
    .sort((a,b) => Number(b.visitor_count) - Number(a.visitor_count) || a.name.localeCompare(b.name));
  return <main className="travel-page"><div className="travel-frame">
    <TravelNav signedIn={signedIn} current="community"/>
    <header className="travel-heading"><div><p className="eyebrow">A SHARED ATLAS OF PLACES WE’VE BEEN</p><h1>A world of places.<br/><span>One shared map.</span></h1><p className="page-intro">From a first trip to a familiar favorite. See where our community has been, and start mapping your own story.</p></div>
      <div className="travel-stat"><strong>{failed ? "—" : counts.length.toString().padStart(2,"0")}</strong><span>countries &amp; territories explored</span><small>{failed ? "Counts temporarily unavailable" : `${total} personal ${total === 1 ? "visit" : "visits"} recorded`}</small></div>
    </header>
    {failed ? <div className="notice" role="alert"><h2>The community map is taking a moment.</h2><p>We couldn’t load visit counts. Please refresh to try again.</p></div> : <><WorldMap counts={counts}/>
      <div className="community-bottom"><section className="community-list"><div className="ledger-heading"><h2>Places on our map</h2><span>{counts.length} explored</span></div>
        {ranked.length ? <ul>{ranked.map(country => <li key={country.country_code}><span>{country.name}</span><span>{country.visitor_count} {Number(country.visitor_count) === 1 ? "traveler" : "travelers"}</span></li>)}</ul> : <p>No trips recorded yet. Be the first to put a country on the map.</p>}
      </section><aside className="map-invitation"><p className="eyebrow">MAKE IT YOURS</p><h2>Your travels belong<br/>on the map.</h2><p>Keep a personal list of the countries you’ve visited. Every new entry adds to our shared picture of the world.</p><Link className="button" href={signedIn ? "/members" : "/login"}>{signedIn ? "Open my travels" : "Sign in with Google"} <span aria-hidden="true">↗</span></Link></aside></div>
    </>}
    <footer className="travel-footer"><span>More travelers. Deeper color. Every country counts once per person.</span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Map data: Natural Earth</a><span>Countries &amp; territories · illustrative boundaries</span></footer>
  </div></main>;
}
