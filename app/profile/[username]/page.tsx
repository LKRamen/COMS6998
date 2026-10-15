/* eslint-disable @next/next/no-img-element -- Public avatar paths are explicitly projected through the avatar route. */
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { createClient } from "../../../lib/supabase/server";
import { discover, publicCreator } from "../../../lib/memes";
import AppShell from "../../components/app-shell";
import MemeGallery from "../../components/meme-gallery";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
 const { username } = await params; const profile = await publicCreator(await createClient(), username);
 return profile ? { title: `${profile.display_name} (@${profile.username})`, description: profile.bio || `Memes by @${profile.username} on Quip.` } : { title: "Creator not found" };
}
export default async function CreatorProfile({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }) {
 const { username } = await params; const { page: inputPage } = await searchParams;
 const page = Math.max(1, Math.min(500, Math.floor(Number(inputPage)) || 1));
 const client = await createClient(); const { data: { user } } = await client.auth.getUser(); const profile = await publicCreator(client, username);
 if (!profile) notFound(); const posts = await discover(client, { username: profile.username, offset: (page - 1) * 20 });
 const own = user?.id === profile.id;
 return <AppShell signedIn={Boolean(user)} current={own ? "profile" : undefined}><main className="creator-profile"><header className="creator-profile-header"><div className="profile-avatar-large">{profile.avatar_path ? <img src={`/api/avatar/${profile.username}`} alt={`${profile.display_name}'s avatar`} width="90" height="90"/> : profile.display_name.slice(0, 1).toUpperCase()}</div><div className="creator-profile-copy"><h1>{profile.display_name}</h1><span className="creator-handle">@{profile.username}</span>{profile.bio && <p className="creator-bio">{profile.bio}</p>}<div className="creator-stats"><span><strong>{profile.memes}</strong>memes</span><span><strong>{profile.upvotes}</strong>upvotes received</span><span>Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "America/New_York" })}</span></div></div>{own && <Link href="/profile" className="secondary-button"><PencilSimple size={16}/>Edit profile</Link>}</header>
  <h2 className="creator-gallery-title">{own ? "Your public collection" : "The collection"}</h2>{posts.length ? <MemeGallery posts={posts} signedIn={Boolean(user)}/> : <section className="state-panel"><h2>{page > 1 ? "That’s the collection." : "The first meme is still cooking."}</h2><p>{own ? "Your published memes will live here. Private drafts stay in My creations." : "Check back for this creator’s first contribution."}</p>{own && <Link className="button" href="/create">Create a meme</Link>}</section>}
  <nav className="gallery-pagination" aria-label="Creator collection pages">{page > 1 && <Link className="secondary-button" href={`/profile/${profile.username}?page=${page - 1}`}>Previous</Link>}{posts.length === 20 && <Link className="secondary-button" href={`/profile/${profile.username}?page=${page + 1}`}>More memes <ArrowRight size={16}/></Link>}</nav>
 </main></AppShell>;
}
