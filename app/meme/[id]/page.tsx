import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { createClient } from "../../../lib/supabase/server";
import { discover } from "../../../lib/memes";
import { isUuid } from "../../../lib/caption-input";
import AppShell from "../../components/app-shell";
import MemeMedia from "../../components/meme-media";
import CreatorLink from "../../components/creator-link";
import MemeVote from "../../components/meme-vote";
import ShareButton from "../../components/share-button";
import CreationControls from "../../components/creation-controls";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
 const { id } = await params; if (!isUuid(id)) return { title: "Meme not found" };
 const post = (await discover(await createClient(), { id }))[0];
 if (!post) return { title: "Meme not found" };
 return { title: post.text.slice(0, 70), description: `A meme by @${post.username}: ${post.text}`, openGraph: { title: post.text, description: `By @${post.username} on Quip`, type: "article", images: [{ url: `/api/meme-image/${id}`, alt: post.text }] }, twitter: { card: "summary_large_image", images: [`/api/meme-image/${id}`] } };
}
export default async function MemeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ published?: string }> }) {
 const { id } = await params; if (!isUuid(id)) notFound();
 const client = await createClient(); const { data: { user } } = await client.auth.getUser();
 const post = (await discover(client, { id }))[0]; if (!post) notFound();
 const { published } = await searchParams;
 return <AppShell signedIn={Boolean(user)}><main className="meme-detail"><Link href="/explore" className="back-link"><ArrowLeft size={16}/>Back to Explore</Link>
  {published && post.own && <p className="form-message success" role="status">Published. Your meme is live in Explore and ready for the feed.</p>}
  <div className="detail-grid"><div className="detail-image"><MemeMedia src={post.photo_url} caption={post.text} rendered={Boolean(post.rendered_path)} eager/></div><section className="detail-info"><CreatorLink username={post.username} name={post.author_name} avatar={post.avatar_path}/><h1>{post.text}</h1><span className="style-tag"><Sparkle size={13}/>{post.style}</span><p>Published {new Date(post.published_at).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" })}</p><p>AI-generated caption{post.rendered_path ? ", with the creator’s final touch." : "."} Human opinions welcome.</p><div className="detail-actions"><MemeVote key={`${post.score}:${post.vote}`} captionId={post.caption_id} score={post.score} vote={post.vote} own={post.own} signedIn={Boolean(user)}/><ShareButton path={`/meme/${id}`} title={post.text}/></div><div className="detail-stats"><span>{post.upvotes} upvotes</span><span>{post.downvotes} downvotes</span></div>{post.rendered_path && <p><a className="back-link" href={`/api/meme-image/${id}`} target="_blank" rel="noreferrer"><ArrowDown size={14}/>Open shareable image</a></p>}{post.own && <><p><Link className="subtle-link" href={`/creations/${id}`}>Your private generation history</Link></p><CreationControls id={id}/></>}</section></div>
 </main></AppShell>;
}
