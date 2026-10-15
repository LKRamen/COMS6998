import Link from "next/link";
import type { Meme } from "../../lib/memes";
import MemeMedia from "./meme-media";
import CreatorLink from "./creator-link";
import MemeVote from "./meme-vote";
import ShareButton from "./share-button";
export default function MemeGallery({ posts, signedIn }: { posts: Meme[]; signedIn: boolean }) {
 return <section className="meme-gallery" aria-label="Published memes">{posts.map(post => <article className="gallery-card" key={post.id}>
  <Link className="gallery-media-link" href={`/meme/${post.id}`} aria-label={`Open meme: ${post.text}`}><MemeMedia src={post.photo_url} caption={post.text} rendered={Boolean(post.rendered_path)}/><span className="gallery-style">{post.style}</span></Link>
  <div className="gallery-card-info"><CreatorLink username={post.username} name={post.author_name} avatar={post.avatar_path} compact/><div className="gallery-card-actions"><MemeVote key={`${post.score}:${post.vote}`} captionId={post.caption_id} score={post.score} vote={post.vote} own={post.own} signedIn={signedIn}/><ShareButton path={`/meme/${post.id}`}/></div></div>
 </article>)}</section>;
}
