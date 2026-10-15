"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { ArrowDown } from "@phosphor-icons/react/dist/csr/ArrowDown";
import { voteMeme } from "../brainrot/actions";
export default function MemeVote({ captionId, score: initialScore, vote: initialVote, signedIn, own }: { captionId: string; score: number; vote: -1 | 1 | null; signedIn: boolean; own: boolean }) {
 const [score, setScore] = useState(initialScore), [vote, setVote] = useState(initialVote), [pending, setPending] = useState(false), [error, setError] = useState("");
 const busy = useRef(false);
 async function change(value: -1 | 1) {
  if (busy.current) return; busy.current = true; setPending(true); setError("");
  const before = { score, vote }, next = vote === value ? null : value;
  setVote(next); setScore(score - (vote ?? 0) + (next ?? 0));
  try {
   const result = await voteMeme(captionId, next);
   if (!result.ok) throw new Error(result.error);
   setVote(result.vote); setScore(result.score);
  } catch (error) { setVote(before.vote); setScore(before.score); setError(error instanceof Error ? error.message : "Vote failed. Please try again."); }
  finally { busy.current = false; setPending(false); }
 }
 return <div><div className="meme-votes" aria-label={own ? "Your post rating" : "Rate this meme"}>
  {own ? <span className="own-post-tag">Your post</span> : signedIn ? <button className="vote-up" aria-label="Upvote meme" aria-pressed={vote === 1} onClick={() => change(1)} disabled={pending}><ArrowUp size={18} weight="bold"/></button> : <ArrowUp size={17}/>}
  <span aria-label={`Net score: ${score}`} aria-live="polite">{score}</span>
  {!own && (signedIn ? <button className="vote-down" aria-label="Downvote meme" aria-pressed={vote === -1} onClick={() => change(-1)} disabled={pending}><ArrowDown size={18} weight="bold"/></button> : <ArrowDown size={17}/>)}
  {own && <small>net score</small>}{!signedIn && !own && <Link href="/login">Sign in to vote</Link>}
 </div>{error && <p className="form-message" role="alert">{error} <Link href="/login">Sign in</Link></p>}</div>;
}
