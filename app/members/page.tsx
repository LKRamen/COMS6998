import { requireCompleteProfile } from "../../lib/auth";
import { getMyVisits } from "../../lib/travel";
import WorldMap from "../components/world-map";
import TravelNav from "../components/travel-nav";
import VisitList from "../components/visit-list";

export default async function Members({ searchParams }: { searchParams: Promise<{ saved?: string; removed?: string; error?: string }> }) {
  const { supabase, user, profile } = await requireCompleteProfile();
  const visits = await getMyVisits(supabase, user.id);
  const params = await searchParams;
  return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn current="personal"/>
    <header className="travel-heading"><div><p className="eyebrow">{profile.first_name}’S TRAVEL JOURNAL</p><h1>Your world,<br/><span>so far.</span></h1><p className="page-intro">A little record of the places that became part of your story.<br/>Add where you’ve been. See how far you’ve come.</p></div><div className="travel-stat"><strong>{visits.length.toString().padStart(2,"0")}</strong><span>countries &amp; territories visited</span><small>Only you can edit this map</small></div></header>
    {params.error && <p className="form-message" role="alert">{params.error === "country" ? "Choose a valid country from the list." : "Your travel list could not be updated. Please try again."}</p>}
    {(params.saved || params.removed) && <p className="form-message success" role="status">{params.removed ? "Country removed from your travels." : "Your travel map is up to date."}</p>}
    <WorldMap personal counts={visits.map(code => ({country_code:code, visitor_count:1}))}/>
    <VisitList visited={visits}/>
    <footer className="travel-footer"><span>Your personal map. Our collective world.</span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Map data: Natural Earth</a><span>Countries &amp; territories · illustrative boundaries</span></footer>
  </div></main>;
}
