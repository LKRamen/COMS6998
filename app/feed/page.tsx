import { createClient } from "../../lib/supabase/server";
import { discover, type Meme } from "../../lib/memes";
import AppShell from "../components/app-shell";
import SwipeDeck from "../components/swipe-deck";
import { preload } from "react-dom";
export const dynamic = "force-dynamic";
export default async function Feed() {
 let posts: Meme[] = [], signedIn = false, failed = false;
 try { const client = await createClient(); const [auth, memes] = await Promise.all([client.auth.getUser(), discover(client, { sort: "swipe" })]); signedIn = Boolean(auth.data.user); posts = memes; } catch { failed = true; }
 if (posts[0]) preload(`${posts[0].photo_url}?source=1`, { as: "image", fetchPriority: "high" });
 return <AppShell signedIn={signedIn} current="feed"><main className="feed-page"><header className="section-heading"><div><p className="overline">THE FEED</p><h1>For the <span>plot.</span></h1></div><p>AI-generated memes.<br/>Your very human opinion.</p></header>
  {failed ? <section className="state-panel" role="alert"><h2>A brief interruption.</h2><p>Memes couldn’t be loaded. Refresh the page to try again.</p></section> : <SwipeDeck initialPosts={posts} signedIn={signedIn}/>}
 </main></AppShell>;
}
