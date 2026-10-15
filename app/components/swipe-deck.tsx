"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Heart } from "@phosphor-icons/react/dist/csr/Heart";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import type { Meme } from "../../lib/memes";
import { loadSwipeMemes, voteMeme } from "../brainrot/actions";
import MemeMedia from "./meme-media";
import CreatorLink from "./creator-link";
import ShareButton from "./share-button";

export default function SwipeDeck({ initialPosts, signedIn, preview = false }: { initialPosts: Meme[]; signedIn: boolean; preview?: boolean }) {
 const [queue, setQueue] = useState(initialPosts), [pending, setPending] = useState(false), [loading, setLoading] = useState(false);
 const [error, setError] = useState(""), [authNeeded, setAuthNeeded] = useState(false), [rated, setRated] = useState(0);
 const [hasMore, setHasMore] = useState(initialPosts.length === 20 && !preview);
 const busy = useRef(false), fetching = useRef(false), seen = useRef(new Set(initialPosts.map(p => p.id)));
 const mounted = useRef(true); const x = useMotionValue(0), rotation = useTransform(x, [-250, 250], [-15, 15]);
 const positive = useTransform(x, [30, 110], [0, 1]), negative = useTransform(x, [-110, -30], [1, 0]);
 const reduced = useReducedMotion(); const current = queue[0];
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 const fetchMore = useCallback(async () => {
  if (fetching.current || !hasMore || seen.current.size >= 2000) return;
  fetching.current = true; setLoading(true);
  try {
   const result = await loadSwipeMemes([...seen.current]);
   if (!mounted.current) return;
   if (!result.ok) throw new Error(result.error);
   for (const post of result.posts) seen.current.add(post.id);
   setQueue(items => [...new Map([...items, ...result.posts].map(post => [post.id, post])).values()]);
   setHasMore(result.posts.length === 20);
  } catch (error) { if (mounted.current) setError(error instanceof Error ? error.message : "More memes couldn’t be loaded. Try again."); }
  finally { fetching.current = false; if (mounted.current) setLoading(false); }
 }, [hasMore]);
 useEffect(() => { if (queue.length <= 5) void fetchMore(); }, [queue.length, fetchMore]);
 const rate = useCallback(async (value: -1 | 1) => {
  if (!current || busy.current) return;
  if (!signedIn) { setAuthNeeded(true); await animate(x, 0, { type: "spring", stiffness: 430, damping: 30 }); return; }
  busy.current = true; setPending(true); setError("");
  try {
   const [result] = await Promise.all([voteMeme(current.caption_id, value), animate(x, value * Math.max(window.innerWidth, 650), { duration: reduced ? 0 : 0.26, ease: "easeOut" })]);
   if (!mounted.current) return;
   if (!result.ok) { if (result.login) setAuthNeeded(true); throw new Error(result.error); }
   x.set(0); setQueue(items => items.filter(post => post.id !== current.id)); setRated(count => count + 1);
  } catch (error) {
   if (!mounted.current) return;
   await animate(x, 0, { type: "spring", stiffness: 430, damping: 30, duration: reduced ? 0 : undefined });
   setError(error instanceof Error ? error.message : "Your vote couldn’t be saved. Try again.");
  } finally { busy.current = false; if (mounted.current) setPending(false); }
 }, [current, signedIn, x, reduced]);
 useEffect(() => {
  if (preview) return;
  const keyboard = (event: KeyboardEvent) => {
   if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
   const target = event.target;
   if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input,textarea,select,button,a,[role=dialog]"))) return;
   if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); void rate(event.key === "ArrowRight" ? 1 : -1); }
  };
  window.addEventListener("keydown", keyboard); return () => window.removeEventListener("keydown", keyboard);
 }, [rate, preview]);
 function previewNext() { if (!busy.current) setQueue(items => items.length > 1 ? [...items.slice(1), items[0]] : items); }
 return <div className={`swipe-experience${preview ? " is-preview" : ""}`}>
  <div className="deck-topline"><span><span className="live-dot"/> {preview ? "FROM THE COMMUNITY" : "FRESH FROM THE COMMUNITY"}</span><span>{preview ? "REAL MEMES. REAL PEOPLE." : `${rated} rated this session`}</span></div>
  <div className="deck-stage">
   {current ? <>
    {queue[1] && <article className="deck-back-card" aria-hidden="true"><MemeMedia src={`${queue[1].photo_url}?source=1`} caption={queue[1].text} eager/></article>}
    <motion.article className="swipe-card" aria-label="Current meme" style={{ x, rotate: rotation }} drag={pending ? false : "x"} dragMomentum={false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.85}
     onDragEnd={(_event, info) => { if (Math.abs(info.offset.x) > 100) void rate(info.offset.x > 0 ? 1 : -1); else void animate(x, 0, { type: "spring", stiffness: 430, damping: 30 }); }}>
     <div className="swipe-card-image"><MemeMedia src={`${current.photo_url}?source=1`} caption={current.text} eager/>
      <motion.div className="reaction-stamp positive" style={{ opacity: positive }}>IT HITS</motion.div><motion.div className="reaction-stamp negative" style={{ opacity: negative }}>NOT IT</motion.div>
      <Link className="meme-detail-shortcut" aria-label="Open meme details" href={`/meme/${current.id}`} onPointerDown={event => event.stopPropagation()}><ArrowUpRight size={20}/></Link>
     </div>
     <div className="swipe-card-meta" onPointerDown={event => event.stopPropagation()}><CreatorLink username={current.username} name={current.author_name} avatar={current.avatar_path}/><span className="style-tag"><Sparkle size={12}/>{current.style}</span><ShareButton path={`/meme/${current.id}`}/></div>
    </motion.article>
   </> : <section className="deck-empty"><span className="empty-symbol"><Sparkle size={40}/></span><h2>{loading ? "Finding your next meme…" : "You’re all caught up."}</h2><p>{loading ? "Hang tight for a moment." : "The internet can wait. Make something funny, or revisit the community’s favorites."}</p><Link className="button" href={signedIn ? "/create" : "/login"}>Create a meme <ArrowUpRight size={17}/></Link><Link href="/explore" className="subtle-link">Explore the gallery</Link></section>}
  </div>
  {current && <><div className="swipe-actions"><div><button className="swipe-vote down" onClick={() => void rate(-1)} disabled={pending} aria-label="Downvote meme"><X size={29} weight="bold"/></button><span>Not it <kbd>←</kbd></span></div>
   {preview ? <button className="preview-next" onClick={previewNext}>Next preview <ArrowRight size={16}/></button> : <p>Swipe your honest opinion.</p>}
   <div><button className="swipe-vote up" onClick={() => void rate(1)} disabled={pending} aria-label="Upvote meme"><Heart size={29} weight="fill"/></button><span>It hits <kbd>→</kbd></span></div></div>
   <p className="deck-help">{pending ? "Saving your vote…" : signedIn ? "Drag a card, tap a button, or use your arrow keys." : "Browse freely. Sign in when you’re ready to vote."}</p></>}
  <div className="deck-feedback" aria-live="polite">{authNeeded && <div className="auth-nudge"><p>Your taste deserves a vote.</p><Link className="button" href="/login">Sign in to vote <ArrowRight size={16}/></Link><button aria-label="Dismiss sign-in message" className="icon-button" onClick={() => setAuthNeeded(false)}><X size={17}/></button></div>}{error && <p className="form-message" role="alert">{error}</p>}{!current && hasMore && !loading && <button className="secondary-button" onClick={() => { setError(""); void fetchMore(); }}><ArrowClockwise size={17}/>Try loading more</button>}{rated > 0 && <span className="sr-only" role="status">Vote saved. {rated} memes rated.</span>}</div>
  {!preview && <Link className="deck-explore-link" href="/explore">More of a browser? Explore the gallery <ArrowRight size={15}/></Link>}
 </div>;
}
