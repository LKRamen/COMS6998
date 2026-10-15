"use client";
import { useEffect, useState } from "react";
import type { GenerationJob } from "./generation-jobs";
export function announceGenerationChange() { window.dispatchEvent(new Event("brainrot-generations")); }
export function useGenerationJobs() {
 const [jobs, setJobs] = useState<GenerationJob[]>([]), [error, setError] = useState("");
 useEffect(() => {
  let alive = true, loading = false, refreshAgain = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  async function load() {
   if (loading) { refreshAgain = true; return; } loading = true;
   let delay = 15000;
   try {
    const response = await fetch("/api/generations", { cache: "no-store", signal: controller.signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Generation status could not be loaded.");
    delay = result.jobs.some((job: GenerationJob) => job.state === "pending") ? 3000 : 15000;
    if (alive) { setJobs(result.jobs); setError(""); }
   } catch (error) { delay = 5000; if (alive) setError(error instanceof Error ? error.message : "Generation status could not be loaded."); }
   finally {
    loading = false; clearTimeout(timer);
    if (alive) timer = setTimeout(() => { void load(); }, refreshAgain ? 0 : delay);
    refreshAgain = false;
   }
  }
  void load();
  window.addEventListener("brainrot-generations", load); window.addEventListener("focus", load);
  return () => { alive = false; controller.abort(); clearTimeout(timer); window.removeEventListener("brainrot-generations", load); window.removeEventListener("focus", load); };
 }, []);
 return { jobs, error };
}
