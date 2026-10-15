/* eslint-disable @next/next/no-img-element -- Private avatar projections bypass image caches. */
import Link from "next/link";
export default function CreatorLink({ username, name, avatar, compact = false }: { username: string; name: string; avatar?: string | null; compact?: boolean }) {
 return <Link className={`creator-link${compact ? " compact" : ""}`} href={`/profile/${username}`}>
  <span className="creator-avatar">{avatar ? <img src={`/api/avatar/${username}`} alt="" width="36" height="36"/> : name.slice(0, 1).toUpperCase()}</span>
  <span><strong>{name}</strong><small>@{username}</small></span>
 </Link>;
}
