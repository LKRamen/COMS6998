import { createClient } from "../../lib/supabase/server";
import { discover, type Meme } from "../../lib/memes";
import AppShell from "../components/app-shell";
import SwipeDeck from "../components/swipe-deck";
export const dynamic = "force-dynamic";
export default async function Feed() {
 let posts: Meme[] = [], signedIn = false, failed = false;
 try { const client = await createClient(); const { data: { user } } = await client.auth.getUser(); signedIn = Boolean(user); posts = await discover(client, { sort: "swipe" }); } catch { failed = true; }
 return <AppShell signedIn={signedIn} current="feed"><main className="feed-page"><header className="section-heading"><div><p className="overline">THE FEED</p><h1>For the <span>plot.</span></h1></div><p>AI-generated memes.<br/>Your very human opinion.</p></header>
  {failed ? <section className="state-panel" role="alert"><h2>A brief interruption.</h2><p>Memes couldn’t be loaded. Refresh the page to try again.</p></section> : <SwipeDeck initialPosts={posts} signedIn={signedIn}/>}
 </main></AppShell>;
}
