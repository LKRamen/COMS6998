"use client";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react/dist/csr/ShareNetwork";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
export default function ShareButton({ path, title = "A little brainrot for you" }: { path: string; title?: string }) {
 const [message, setMessage] = useState("");
 async function share() {
  const url = new URL(path, window.location.origin).href;
  try {
   if (navigator.share) { await navigator.share({ title, url }); setMessage("Shared"); }
   else { await navigator.clipboard.writeText(url); setMessage("Link copied"); }
  } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Copy the URL from your address bar."); }
 }
 return <span className="share-control"><button className="icon-button" onClick={share} aria-label="Share meme">{message === "Link copied" ? <Check size={19}/> : <ShareNetwork size={19}/>}</button><span role="status">{message}</span></span>;
}
