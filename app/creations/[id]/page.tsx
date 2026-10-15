import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { requireCompleteProfile } from "../../../lib/auth";
import { getAllowance, getMoment } from "../../../lib/captions";
import { isUuid } from "../../../lib/caption-input";
import AppShell from "../../components/app-shell";
import MemeStudio from "../../components/meme-studio";
import MemeMedia from "../../components/meme-media";
import CreationControls from "../../components/creation-controls";
export const maxDuration = 60;
export default async function Draft({ params }: { params: Promise<{ id: string }> }) {
 const { supabase } = await requireCompleteProfile(); const { id } = await params; if (!isUuid(id)) notFound();
 const moment = await getMoment(supabase, id); if (!moment) notFound();
 return <AppShell signedIn current="create"><main className="studio-page"><header className="section-heading"><div><p className="overline">{moment.status === "draft" ? "PRIVATE UNTIL YOU PUBLISH" : "YOUR PUBLISHED MEME"}</p><h1>{moment.status === "draft" ? "Find the funny" : "Out in the world"}<span>.</span></h1></div><Link href="/creations" className="back-link"><ArrowLeft size={16}/>My creations</Link></header>
  {moment.status === "draft" ? <MemeStudio key={moment.photo_revision} moment={moment} allowance={await getAllowance(supabase)}/> : <section><div className="studio-saved"><CheckCircle size={42}/><h2>It’s officially a meme.</h2><p>Published captions stay fixed, so every vote keeps its meaning.</p><MemeMedia src={`/api/meme-image/${id}`} caption={moment.caption_override || moment.captions.find(c => c.id === moment.selected_caption_id)?.text || ""} rendered={Boolean(moment.rendered_path)}/><div className="hero-actions"><Link className="button" href={`/meme/${id}`}>View public meme ↗</Link><Link className="secondary-button" href="/create">Make another</Link></div></div><details className="private-history"><summary>Private generation history</summary>{moment.runs.map(run => <section key={run.id}><h3>{run.style} · {run.model}</h3>{moment.captions.filter(c => c.generation_run_id === run.id).map(c => <p key={c.id}>{c.text}</p>)}<pre>{run.system_prompt}</pre><pre>{run.user_prompt}</pre></section>)}</details><CreationControls id={id}/></section>}
 </main></AppShell>;
}
