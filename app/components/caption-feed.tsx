/* eslint-disable @next/next/no-img-element -- Short-lived signed images must not enter an image optimization cache. */
"use client";
import { useEffect, useState } from "react";
import type { FeedPost } from "../../lib/captions";
import { loadMoreFeed } from "../feed/actions";
import VoteControl from "./vote-control";
import CreationControls from "./creation-controls";
export default function CaptionFeed({ initialPosts, sort, initialOffset, canLoadMore, signedIn, country }: { initialPosts: FeedPost[]; sort: "new" | "top"; initialOffset: number; canLoadMore: boolean; signedIn: boolean; country?: string }) {
 const [feed, setFeed] = useState({ source: initialPosts, extraPosts: [] as FeedPost[], loadedPages: 0, hasMore: canLoadMore, refreshing: false });
 const [pending, setPending] = useState(false); const [error, setError] = useState("");
 // A vote can move a card across the first-page boundary. Re-fetch loaded pages
 // against the new ordering instead of merging a fresh first page into stale pages.
 if (feed.source !== initialPosts) setFeed({ ...feed, source: initialPosts, refreshing: feed.loadedPages > 0, hasMore: canLoadMore });
 useEffect(() => {
  if (!feed.refreshing) return;
  let cancelled = false;
  async function reconcile() {
   try {
    const extraPosts: FeedPost[] = []; let loadedPages = 0; let hasMore = canLoadMore;
    for (let page = 1; page <= feed.loadedPages; page++) {
     const offset = initialOffset + page * 20;
     const result = country ? await loadMoreFeed(sort, offset, country) : await loadMoreFeed(sort, offset);
     if (cancelled) return;
     if (!result.ok) throw new Error(result.error);
     extraPosts.push(...result.posts); loadedPages = page; hasMore = result.hasMore;
     if (!hasMore) break;
    }
    setFeed(current => current.source === initialPosts ? { ...current, extraPosts: [...new Map(extraPosts.map(post => [post.id, post])).values()], loadedPages, hasMore, refreshing: false } : current);
   } catch {
    if (cancelled) return;
    setError("The feed changed, but older captions could not be refreshed. Load more to try again.");
    setFeed(current => current.source === initialPosts ? { ...current, extraPosts: [], loadedPages: 0, hasMore: canLoadMore, refreshing: false } : current);
   }
  }
  void reconcile(); return () => { cancelled = true; };
 }, [feed.refreshing, feed.loadedPages, initialPosts, initialOffset, sort, canLoadMore, country]);
 const initialIds = new Set(initialPosts.map(p => p.id)); const posts = [...initialPosts, ...feed.extraPosts.filter(p => !initialIds.has(p.id))];
 async function more() {
  if (pending || feed.refreshing) return; setPending(true); setError("");
  try {
   const offset = initialOffset + (feed.loadedPages + 1) * 20;
   const result = country ? await loadMoreFeed(sort, offset, country) : await loadMoreFeed(sort, offset);
   if (!result.ok) throw new Error(result.error);
   setFeed(current => current.source !== initialPosts ? current : { ...current, extraPosts: [...new Map([...current.extraPosts, ...result.posts].map(p => [p.id, p])).values()], loadedPages: current.loadedPages + 1, hasMore: result.hasMore });
  } catch (error) { setError(error instanceof Error ? error.message : "More captions could not be loaded. Please try again."); }
  finally { setPending(false); }
 }
 return <><section className="caption-grid" aria-label="Travel captions">{posts.map(post => <article className="caption-card" key={post.id}>
  {post.photo_url ? <img className="caption-image" src={post.photo_url} alt={post.location ? `Travel moment from ${post.location}` : "A shared travel moment"} loading="lazy"/> : <div className="image-missing">Photo unavailable. Refresh to renew access.</div>}
  <div className="caption-card-body"><div className="caption-meta"><span>{post.location || "Somewhere worth remembering"}</span><span>{post.style}</span></div><p className="caption-text">{post.text}</p><p className="caption-byline">By {post.author_name} · {new Date(post.published_at).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" })}</p>
   <VoteControl key={`${post.caption_id}:${post.score}:${post.vote}`} captionId={post.caption_id} score={post.score} vote={post.vote} signedIn={signedIn} own={post.own}/>{post.own && <CreationControls id={post.id}/>}</div>
 </article>)}</section>{feed.hasMore && <div className="feed-pagination"><button className="button" onClick={more} disabled={pending || feed.refreshing}>{pending || feed.refreshing ? "Loading…" : "Load more"}</button></div>}{error && <p className="form-message" role="alert">{error}</p>}</>;
}
