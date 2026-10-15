"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
const savedEvent = "brainrot:swipe-vote-saved";
export function notifySwipeVoteSaved() { window.dispatchEvent(new Event(savedEvent)); }
export default function VoteNavigationRefresh() {
 const path = usePathname(), search = useSearchParams(), router = useRouter();
 const route = `${path}?${search.toString()}`;
 const version = useRef(0), visited = useRef(new Map<string, number>());
 useEffect(() => {
  // Refresh visited galleries/details on navigation, never during an active swipe.
  if (path !== "/feed" && visited.current.has(route) && visited.current.get(route) !== version.current) router.refresh();
  visited.current.set(route, version.current);
  function saved() {
   version.current += 1;
   if (path !== "/feed") { visited.current.set(route, version.current); router.refresh(); }
  }
  window.addEventListener(savedEvent, saved);
  return () => window.removeEventListener(savedEvent, saved);
 }, [path, route, router]);
 return null;
}
