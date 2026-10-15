"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useGenerationJobs } from "../../lib/use-generation-jobs";
const storageKey = "brainrot:generation-notice-dismissed";
function subscribe(listener: () => void) { window.addEventListener("brainrot-notice", listener); return () => window.removeEventListener("brainrot-notice", listener); }
export default function GenerationStatus() {
 const { jobs } = useGenerationJobs();
 const [dismissed, setDismissed] = useState<string[]>([]);
 const stored = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; } }, () => "");
 const job = jobs.find(job => job.moment_id && (job.state === "pending" || (!dismissed.includes(job.id) && !stored.split(",").includes(job.id))));
 if (!job) return null;
 const pending = job.state === "pending", succeeded = job.state === "succeeded";
 function dismiss() {
  setDismissed(ids => [...ids, job!.id]);
  try { localStorage.setItem(storageKey, [...stored.split(",").filter(Boolean), job!.id].slice(-40).join(",")); window.dispatchEvent(new Event("brainrot-notice")); } catch { /* The current page still dismisses the notice. */ }
 }
 return <aside className="generation-notice" aria-label="Your caption generation"><div role="status"><strong>{pending ? "Your captions are cooking." : succeeded ? "Your captions are ready." : "That generation needs another try."}</strong><span>{pending ? "Keep scrolling. We’ll save them to your draft." : succeeded ? "Choose your favorite and make it a meme." : job.error_message || "Your photo and draft are saved."}</span></div>{pending && <Link href="/feed" className="text-button">Keep scrolling ↗</Link>}<Link href={`/creations/${job.moment_id}`} className="text-button">{pending ? "Open draft" : succeeded ? "See captions" : "Retry in studio"} ↗</Link>{!pending && <button type="button" className="text-button" aria-label="Dismiss generation notice" onClick={dismiss}>Dismiss</button>}</aside>;
}
