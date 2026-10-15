import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Fire } from "@phosphor-icons/react/dist/ssr/Fire";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { Trophy } from "@phosphor-icons/react/dist/ssr/Trophy";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { createClient } from "../../lib/supabase/server";
import { discover, type Meme, type DiscoverSort } from "../../lib/memes";
import AppShell from "../components/app-shell";
import MemeGallery from "../components/meme-gallery";
export const dynamic = "force-dynamic";
export default async function Explore({ searchParams }: { searchParams: Promise<{ sort?: string; q?: string; page?: string }> }) {
 const params = await searchParams; const sort: DiscoverSort = params.sort === "new" || params.sort === "top" ? params.sort : "trending";
 const query = (params.q ?? "").trim().slice(0, 80), page = Math.max(1, Math.min(500, Math.floor(Number(params.page)) || 1));
 let posts: Meme[] = [], signedIn = false, failed = false;
 try { const client = await createClient(); const { data: { user } } = await client.auth.getUser(); signedIn = Boolean(user); posts = await discover(client, { sort, query: query.replace(/^@/, ""), offset: (page - 1) * 20 }); } catch { failed = true; }
 const url = (s: string, p = 1) => `/explore?${new URLSearchParams({ sort: s, ...(query ? { q: query } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;
 return <AppShell signedIn={signedIn} current="explore"><main className="explore-page"><header className="section-heading"><div><p className="overline">THE COMMUNITY’S CAMERA ROLL</p><h1>Quality <span>nonsense.</span></h1></div><p>A gallery of questionable genius.<br/>Find your kind of funny.</p></header>
  <div className="explore-toolbar"><nav aria-label="Sort memes" className="segmented-tabs">{[{ key: "trending", label: "Trending", icon: Fire }, { key: "new", label: "New", icon: Clock }, { key: "top", label: "Top", icon: Trophy }].map(tab => <Link href={url(tab.key)} key={tab.key} aria-current={sort === tab.key ? "page" : undefined}><tab.icon size={17}/>{tab.label}</Link>)}</nav><form className="search-form" action="/explore"><MagnifyingGlass size={19}/><input aria-label="Search captions or creators" name="q" defaultValue={query} placeholder="Search captions or @creators" maxLength={80}/><input type="hidden" name="sort" value={sort}/><button type="submit" aria-label="Search"><ArrowRight size={18}/></button></form></div>
  {query && <p className="search-summary">Results for “{query}” <Link href="/explore">Clear search</Link></p>}
  {failed ? <section className="state-panel" role="alert"><h2>Explore is taking a moment.</h2><p>Memes couldn’t be loaded. Refresh to try again.</p></section> : posts.length ? <MemeGallery posts={posts} signedIn={signedIn}/> : <section className="state-panel"><h2>{query ? "No matches. Yet." : page > 1 ? "You’ve reached the end." : "A blank canvas for bad ideas."}</h2><p>{query ? "Try another username or a shorter phrase." : "Be the reason someone opens this app."}</p><Link className="button" href={query ? "/explore" : signedIn ? "/create" : "/login"}>{query ? "See all memes" : "Create a meme"}</Link></section>}
  {!failed && <nav className="gallery-pagination" aria-label="Gallery pages">{page > 1 && <Link className="secondary-button" href={url(sort, page - 1)}><ArrowLeft size={17}/>Previous</Link>}{posts.length === 20 && <Link className="secondary-button" href={url(sort, page + 1)}>More memes <ArrowRight size={17}/></Link>}</nav>}
 </main></AppShell>;
}
