"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Meme } from "../../lib/memes";
import MemeGallery from "../components/meme-gallery";
import styles from "./explore-results.module.css";
type GalleryPage = { posts: Meme[]; hasMore: boolean; nextOffset: number };
async function fetchPage(sort: string, query: string, offset: number, signal: AbortSignal): Promise<GalleryPage> {
 const params = new URLSearchParams({ sort, offset: String(offset), ...(query ? { q: query } : {}) });
 const response = await fetch(`/api/explore?${params}`, { cache: "no-store", signal });
 if (!response.ok) throw new Error("Gallery read failed");
 return response.json();
}
export default function InfiniteGallery({ initialPosts, sort, query, initialOffset, signedIn }: { initialPosts: Meme[]; sort: "new" | "top" | "trending"; query: string; initialOffset: number; signedIn: boolean }) {
 const [extra, setExtra] = useState<Meme[]>([]), [hasMore, setHasMore] = useState(initialPosts.length === 20);
 const [loading, setLoading] = useState(false), [error, setError] = useState("");
 const offset = useRef(initialOffset + initialPosts.length), busy = useRef(false), sentinel = useRef<HTMLDivElement>(null);
 const request = useRef<AbortController | null>(null);
 const previousInitial = useRef(initialPosts);
 const load = useCallback(async () => {
  if (busy.current || !hasMore) return;
  busy.current = true; setLoading(true); setError("");
  const controller = new AbortController(); request.current = controller;
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
   const result = await fetchPage(sort, query, offset.current, controller.signal);
   if (controller.signal.aborted) return;
   setExtra(previous => {
    const seen = new Set([...initialPosts, ...previous].map(post => post.id));
    return [...previous, ...result.posts.filter(post => { if (seen.has(post.id)) return false; seen.add(post.id); return true; })];
   });
   offset.current = result.nextOffset; setHasMore(result.hasMore);
  } catch {
   if (request.current === controller) setError("More memes couldn’t be loaded. Your place is saved.");
  } finally {
   clearTimeout(timeout);
   if (request.current === controller) { request.current = null; busy.current = false; setLoading(false); }
  }
 }, [hasMore, initialPosts, query, sort]);
 useEffect(() => () => { const active = request.current; request.current = null; active?.abort(); }, []);
 useEffect(() => {
  if (previousInitial.current === initialPosts) return;
  previousInitial.current = initialPosts;
  const end = offset.current, controller = new AbortController();
  request.current?.abort(); request.current = controller; busy.current = true;
  // A route refresh must reconcile every loaded batch, including personalized votes.
  async function reconcile() {
   const timeout = setTimeout(() => controller.abort(), 15000);
   try {
    await Promise.resolve();
    if (controller.signal.aborted) return;
    setLoading(true); setError("");
    const posts: Meme[] = []; let next = initialOffset + initialPosts.length, more = initialPosts.length === 20;
    while (more && next < end) {
     const batch = await fetchPage(sort, query, next, controller.signal);
     posts.push(...batch.posts); next = batch.nextOffset; more = batch.hasMore;
    }
    if (controller.signal.aborted) return;
    const seen = new Set(initialPosts.map(post => post.id));
    setExtra(posts.filter(post => { if (seen.has(post.id)) return false; seen.add(post.id); return true; }));
    offset.current = next; setHasMore(more);
   } catch {
    if (request.current === controller) {
     // Drop stale vote controls if reconciliation fails; the next retry starts here.
     setExtra([]); offset.current = initialOffset + initialPosts.length; setHasMore(initialPosts.length === 20);
     setError("More memes couldn’t be loaded. Your place is saved.");
    }
   } finally {
    clearTimeout(timeout);
    if (request.current === controller) { request.current = null; busy.current = false; setLoading(false); }
   }
  }
  void reconcile();
  return () => { if (request.current === controller) request.current = null; controller.abort(); };
 }, [initialPosts, initialOffset, query, sort]);
 useEffect(() => {
  if (!hasMore || loading || error || !sentinel.current) return;
  if (typeof IntersectionObserver !== "undefined") {
   let active = true;
   const observer = new IntersectionObserver(entries => { if (active && entries.some(entry => entry.isIntersecting)) void load(); }, { rootMargin: "600px" });
   observer.observe(sentinel.current); return () => { active = false; observer.disconnect(); };
  }
  const check = () => { if (sentinel.current && sentinel.current.getBoundingClientRect().top < window.innerHeight + 600) void load(); };
  window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check); check();
  return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
 }, [hasMore, loading, error, load]);
 const firstIds = new Set(initialPosts.map(post => post.id));
 return <><MemeGallery posts={[...initialPosts, ...extra.filter(post => !firstIds.has(post.id))]} signedIn={signedIn}/>
  <div className={styles.scrollStatus} ref={sentinel}>
   {error ? <><p role="alert">{error}</p><button className="secondary-button" type="button" onClick={() => void load()}>Retry loading memes</button></> : <p role="status">{loading ? <><span className={styles.spinner} aria-hidden="true"/>Loading more memes…</> : hasMore ? "Keep scrolling. There’s more funny below." : "You’re all caught up. That’s every meme for now."}</p>}
  </div>
 </>;
}
