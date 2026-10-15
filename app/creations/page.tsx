/* eslint-disable @next/next/no-img-element -- Private signed draft images must not enter shared image caches. */
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Stack } from "@phosphor-icons/react/dist/ssr/Stack";
import { requireCompleteProfile } from "../../lib/auth";
import { getCreations } from "../../lib/captions";
import AppShell from "../components/app-shell";
import CreationControls from "../components/creation-controls";
import MemeMedia from "../components/meme-media";
import styles from "./creations.module.css";

export default async function Creations({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
 const { supabase, user } = await requireCompleteProfile();
 const { status } = await searchParams;
 const filter = status === "draft" || status === "published" ? status : "all";
 let failed = false; let rows: Awaited<ReturnType<typeof getCreations>> = [];
 try { rows = await getCreations(supabase, user.id); } catch { failed = true; }
 const drafts = rows.filter(row => row.status === "draft").length;
 const published = rows.filter(row => row.status === "published").length;
 const visible = filter === "all" ? rows : rows.filter(row => row.status === filter);
 const filters = [{ key: "all", label: "All", count: rows.length }, { key: "draft", label: "Drafts", count: drafts }, { key: "published", label: "Published", count: published }];
 return <AppShell signedIn current="creations"><main className={styles.page}>
  <header className={styles.heading}><div><p className="overline">YOUR CORNER OF THE INTERNET</p><h1>My creations<span>.</span></h1><p className={styles.intro}>Half-baked ideas. Fully cooked memes. All yours.</p></div><Link className="button" href="/create"><Plus size={18}/>New meme</Link></header>
  {failed ? <section className="state-panel" role="alert"><h2>Your creations couldn’t be loaded.</h2><p>Please try again to see your saved work.</p><Link className="secondary-button" href="/creations">Try again</Link></section> : <>
   <div className={styles.toolbar}><nav className={styles.filters} aria-label="Filter your creations">{filters.map(item => <Link key={item.key} href={item.key === "all" ? "/creations" : `/creations?status=${item.key}`} aria-current={filter === item.key ? "page" : undefined}>{item.label}{" "}<span>{item.count}</span></Link>)}</nav><p className={styles.privacy}>Drafts stay private until you publish.</p></div>
   {!visible.length ? <section className={styles.empty}><Stack size={38} weight="thin"/><p className="overline">{rows.length ? "ROOM FOR MORE" : "A BLANK CANVAS"}</p><h2>{filter === "published" ? "Your audience can wait." : filter === "draft" ? "No drafts on the back burner." : "Your first meme starts here."}</h2><p>{filter === "published" ? "Pick a caption you love and publish it when you’re ready." : "Start with a photo. Find the caption. Make it yours."}</p><Link className="button" href={filter === "published" && drafts ? "/creations?status=draft" : "/create"}>{filter === "published" && drafts ? "Browse your drafts" : "Create a meme"}<ArrowUpRight size={17}/></Link></section> : <section className={styles.grid} aria-label="Your creations">{visible.map(row => {
    const draft = row.status === "draft";
    const title = row.caption || (draft ? "A good caption is still cooking." : "Your published meme.");
    const destination = draft ? `/creations/${row.id}` : `/meme/${row.id}`;
    const date = new Date(draft ? row.created_at : row.published_at || row.created_at).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });
    return <article className={styles.card} key={row.id}>
     <Link className={styles.preview} href={destination} aria-label={`${draft ? "Open draft" : "Open published meme"}: ${title}`} prefetch={false}>
      {row.photo_url ? draft ? <img src={row.photo_url} alt="Your private draft image" loading="lazy" decoding="async"/> : <MemeMedia src={row.photo_url} caption={row.caption} rendered={Boolean(row.rendered_path)}/> : <div className={styles.unavailable}>Preview unavailable</div>}
      <span className={`${styles.badge} ${draft ? styles.draft : styles.published}`}><span/>{draft ? "Private draft" : "Published"}</span>
     </Link>
     <div className={styles.cardBody}><div className={styles.meta}><span>{row.style}</span><time dateTime={draft ? row.created_at : row.published_at || row.created_at}>{date}</time></div><h2>{title}</h2>
      <Link className={styles.primaryLink} href={destination}>{draft ? "Continue draft" : "View public post"}<ArrowUpRight size={16}/></Link>
      <div className={styles.cardFooter}>{!draft && <Link href={`/creations/${row.id}`}>Private history</Link>}<CreationControls id={row.id}/></div>
     </div>
    </article>;
   })}</section>}
  </>}
  <footer className={styles.footer}><p>Your ideas, from first draft to final post.</p><CreationControls/></footer>
 </main></AppShell>;
}
