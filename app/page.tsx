import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import { getFeed, type FeedPost } from "../lib/captions";
import TravelNav from "./components/travel-nav";
import CaptionFeed from "./components/caption-feed";
import { countries, isCountryCode } from "../lib/countries";
export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams?: Promise<{ sort?: string; page?: string; country?: string }> }) {
 const params = await searchParams ?? {}; const sort = params.sort === "top" ? "top" : "new";
 const country = isCountryCode(params.country) ? params.country : undefined;
 const countrySuffix = country ? `&country=${country}` : "";
 const page = Math.max(1, Math.min(500, Math.floor(Number(params.page)) || 1));
 let signedIn = false; let failed = false; let posts: FeedPost[] = [];
 try { const client = await createClient(); const { data: { user } } = await client.auth.getUser(); signedIn = Boolean(user); posts = await getFeed(sort, (page - 1) * 20, client, user?.id, country); }
 catch { failed = true; }
 return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn={signedIn} current="feed"/>
  <header className="caption-heading"><div><p className="eyebrow">PLACES, PEOPLE & A FEW GOOD WORDS</p><h1>Every trip has<br/><span>a caption.</span></h1><p className="page-intro">Big journeys. Small discoveries. Share a travel photo, let AI find the words, and see which moments land.</p></div><Link className="button" href={signedIn ? "/create" : "/login"}>Create captions <span aria-hidden="true">↗</span></Link></header>
  <div className="feed-toolbar"><div className="feed-tabs" aria-label="Feed sorting"><Link href={country ? `/?country=${country}` : "/"} aria-current={sort === "new" ? "page" : undefined}>New</Link><Link href={`/?sort=top${countrySuffix}`} aria-current={sort === "top" ? "page" : undefined}>Top this week</Link></div><p>One photo. One AI caption. Your call.</p></div>
  {country && <p>Posts from {countries.find(c => c.code === country)?.name} · <Link href="/">All places</Link></p>}
  {failed ? <section className="notice" role="alert"><h2>The feed is taking a moment.</h2><p>We couldn’t load captions. Please refresh to try again.</p></section> : posts.length === 0 ? <section className="feed-empty"><p className="eyebrow">A NEW CHAPTER</p><h2>{page > 1 ? "You’re all caught up." : country ? "No posts from this country yet." : sort === "top" ? "This week’s stories start here." : "A moment worth sharing?"}</h2><p>{page > 1 ? "Return to the newest moments." : "Bring a photo from somewhere you’ve been. We’ll help you find its caption."}</p><Link className="button" href={page > 1 ? `/?sort=${sort}${countrySuffix}` : signedIn ? "/create" : "/login"}>{page > 1 ? "Back to the feed" : "Create the first post"}</Link></section> : <CaptionFeed key={`${sort}:${page}:${country ?? "all"}`} initialPosts={posts} sort={sort} initialOffset={(page - 1) * 20} canLoadMore={posts.length === 20} signedIn={signedIn} country={country}/>}
  {page > 1 && <p><Link href={`/?sort=${sort}&page=${page - 1}${countrySuffix}`}>← Previous page</Link></p>}
  <footer className="travel-footer"><span>AI-generated captions. Human opinions.</span><Link href="/atlas">Explore the travel atlas ↗</Link><span>Rate the caption, not the traveler.</span></footer>
 </div></main>;
}
