"use client";
import Link from "next/link";
import { useState } from "react";
import { castVote } from "../creations/actions";
export default function VoteControl({ captionId, score: initialScore, vote: initialVote, signedIn, own }: { captionId: string; score: number; vote: -1 | 1 | null; signedIn: boolean; own: boolean }) {
 const [score, setScore] = useState(initialScore); const [vote, setVote] = useState(initialVote);
 const [pending, setPending] = useState(false); const [error, setError] = useState("");
 async function change(value: -1 | 1) {
  if (pending) return;
  setPending(true); setError("");
  try { const result = await castVote(captionId, vote === value ? null : value); if (!result.ok) setError(result.error); else { setVote(result.vote); setScore(result.score); } }
  catch { setError("Your vote could not be saved. Sign in or try again."); }
  finally { setPending(false); }
 }
 return <div><div className="caption-votes" aria-label="Rate how well the caption fits the photo">
  {signedIn && !own ? <button type="button" aria-label="Upvote caption" aria-pressed={vote === 1} disabled={pending} onClick={() => change(1)}>↑</button> : <span aria-hidden="true">↑</span>}
  <span className="caption-score" aria-label={`Net score: ${score}`} aria-live="polite">{score}</span>
  {signedIn && !own ? <button type="button" aria-label="Downvote caption" aria-pressed={vote === -1} disabled={pending} onClick={() => change(-1)}>↓</button> : <span aria-hidden="true">↓</span>}
  {!signedIn && <Link href="/login">Sign in to vote</Link>}{own && <span className="muted">Your post</span>}{pending && <span role="status">Saving…</span>}
 </div>{error && <p className="form-message" role="alert">{error}</p>}</div>;
}
