import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompleteProfile } from "../../../lib/auth";
import { getAllowance, getMoment } from "../../../lib/captions";
import { isUuid } from "../../../lib/caption-input";
import TravelNav from "../../components/travel-nav";
import CaptionDraft from "../../components/caption-draft";
import CreationControls from "../../components/creation-controls";
export const maxDuration = 60;
export default async function Draft({ params }: { params: Promise<{ id: string }> }) {
 const { supabase, profile } = await requireCompleteProfile(); const { id } = await params; if (!isUuid(id)) notFound();
 const moment = await getMoment(supabase, id); if (!moment) notFound();
 return <main className="travel-page"><div className="travel-frame"><TravelNav signedIn current="creations"/><header className="caption-heading"><div><p className="eyebrow">{moment.status === "draft" ? "PRIVATE UNTIL YOU PUBLISH" : "A MOMENT YOU SHARED"}</p><h1>{moment.status === "draft" ? "Find the words" : "Published"}<span>.</span></h1></div><Link href="/creations">← My creations</Link></header>
  {moment.status === "draft" ? <CaptionDraft key={moment.photo_revision} moment={moment} allowance={await getAllowance(supabase)} firstName={profile.first_name ?? "Traveler"}/> : <section className="upload-card"><p className="preview-caption">{moment.captions.find(c => c.id === moment.selected_caption_id)?.text}</p><p>Your published caption stays fixed so votes keep their meaning.</p><Link href="/">Back to feed</Link><details><summary>Private generation history</summary>{moment.runs.map(run => <section key={run.id}><h2>{run.style} · {run.model}</h2><ul>{moment.captions.filter(c => c.generation_run_id === run.id).map(c => <li key={c.id}>{c.text}</li>)}</ul><pre>{run.system_prompt}</pre><pre>{run.user_prompt}</pre></section>)}</details><CreationControls id={id}/></section>}
 </div></main>;
}
