import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { createClient } from "../lib/supabase/server";
import { isProfileComplete, readProfile } from "../lib/auth";
import { discover, type Meme } from "../lib/memes";
import AppShell from "./components/app-shell";
import SwipeDeck from "./components/swipe-deck";
export const dynamic = "force-dynamic";
export default async function Home() {
 let posts: Meme[] = [], failed = false, signedIn = false, profileComplete = false;
 try {
  const client = await createClient(); const { data: { user } } = await client.auth.getUser(); signedIn = Boolean(user);
  if (user) profileComplete = isProfileComplete(await readProfile(client, user.id));
  else posts = await discover(client, { sort: "trending" });
 } catch { failed = true; }
 if (signedIn) redirect(profileComplete ? "/feed" : "/onboarding");
 return <AppShell signedIn={false}><main className="landing-page"><section className="landing-hero"><div className="landing-copy">
  <p className="overline"><span className="accent-dot"/> A VERY GOOD USE OF YOUR BAD IDEAS</p>
  <h1>Your brain.<br/><span>Off duty.</span></h1>
  <p className="hero-intro">Turn your camera roll into comedy.<br/>AI makes the memes. You decide what hits.</p>
  <div className="hero-actions"><Link href="/login" className="button">Create with AI <Sparkle size={20} weight="fill"/></Link><Link href="/feed" className="secondary-button">Start swiping <ArrowUpRight size={19}/></Link></div>
  <p className="hero-footnote">Your photos. Three AI takes. Zero comedy degree required.</p>
  <div className="hero-sticker" aria-hidden="true">HUMAN TASTE.<br/><span>ARTIFICIAL NONSENSE.</span><span className="sticker-star">✳</span></div>
 </div><div className="landing-demo">{failed ? <section className="state-panel" role="alert"><h2>The feed is taking a moment.</h2><p>We couldn’t load memes. Refresh to try again.</p><Link href="/explore">Open Explore <ArrowRight size={17}/></Link></section> : <SwipeDeck initialPosts={posts.slice(0, 5)} signedIn={false} preview/>}</div></section>
 <div className="landing-divider"><span>LOW EFFORT. HIGHLY SPECIFIC.</span><span>POWERED BY GEMINI. JUDGED BY YOU.</span><span>NO FAKE INTERNET POINTS.</span></div>
 <section className="how-it-works" aria-label="How Quip works"><div className="how-heading"><p className="overline">THE CAMERA-ROLL-TO-COMEDY PIPELINE</p><h2>It’s not that deep.<br/>It’s just that funny.</h2><Link href="/login">Make your first meme <ArrowUpRight size={18}/></Link></div><ol><li><span>01</span><div><h3>Drop the photo.</h3><p>Your roommate. Your commute. That deeply questionable lunch.</p></div></li><li><span>02</span><div><h3>Let AI cook.</h3><p>Choose a vibe. Get three original captions. Keep the one that gets you.</p></div></li><li><span>03</span><div><h3>Let the feed decide.</h3><p>Publish your masterpiece. Swipe on everyone else’s. Taste is subjective.</p></div></li></ol></section>
 <section className="landing-last"><p className="overline">SOMEWHERE BETWEEN A GROUP CHAT AND A GALLERY</p><h2>Bring your weird.</h2><Link href="/explore" className="secondary-button">Meet the community <ArrowUpRight size={19}/></Link></section>
 </main></AppShell>;
}
