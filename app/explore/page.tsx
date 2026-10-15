import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { discover, type Meme, type DiscoverSort } from "../../lib/memes";
import AppShell from "../components/app-shell";
import MemeGallery from "../components/meme-gallery";
import ExploreResults from "./explore-results";
export const dynamic = "force-dynamic";
export default async function Explore({ searchParams }: { searchParams: Promise<{ sort?: string; q?: string; page?: string }> }) {
 const params = await searchParams; const sort: DiscoverSort = params.sort === "new" || params.sort === "top" ? params.sort : "trending";
 const query = (params.q ?? "").trim().slice(0, 80), page = Math.max(1, Math.min(500, Math.floor(Number(params.page)) || 1));
 let posts: Meme[] = [], signedIn = false, failed = false;
 try { const client = await createClient(); const { data: { user } } = await client.auth.getUser(); signedIn = Boolean(user); posts = await discover(client, { sort, query: query.replace(/^@/, ""), offset: (page - 1) * 20 }); } catch { failed = true; }
 return <AppShell signedIn={signedIn} current="explore"><main className="explore-page"><header className="section-heading"><div><p className="overline">THE COMMUNITY’S CAMERA ROLL</p><h1>Quality <span>nonsense.</span></h1></div><p>A gallery of questionable genius.<br/>Find your kind of funny.</p></header>
  <ExploreResults sort={sort} query={query} page={page} hasMore={posts.length === 20} failed={failed}>
  {failed ? <section className="state-panel" role="alert"><h2>Explore is taking a moment.</h2><p>Memes couldn’t be loaded. Your selected sort and search are saved.</p></section> : posts.length ? <MemeGallery posts={posts} signedIn={signedIn}/> : <section className="state-panel"><h2>{query ? "No matches. Yet." : page > 1 ? "You’ve reached the end." : "A blank canvas for bad ideas."}</h2><p>{query ? "Try another username or a shorter phrase." : "Be the reason someone opens this app."}</p><Link className="button" href={query ? "/explore" : signedIn ? "/create" : "/login"}>{query ? "See all memes" : "Create a meme"}</Link></section>}
  </ExploreResults>
 </main></AppShell>;
}
