"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { Fire } from "@phosphor-icons/react/dist/csr/Fire";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { Trophy } from "@phosphor-icons/react/dist/csr/Trophy";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import styles from "./explore-results.module.css";
type Sort = "trending" | "new" | "top";
const tabs = [{ key: "trending", label: "Trending", icon: Fire }, { key: "new", label: "New", icon: Clock }, { key: "top", label: "Top", icon: Trophy }] as const;
export default function ExploreResults({ sort, query, page, hasMore, failed, children }: { sort: Sort; query: string; page: number; hasMore: boolean; failed: boolean; children: ReactNode }) {
 const router = useRouter(), [pending, startTransition] = useTransition();
 const [target, setTarget] = useState({ sort, page, query }), [navigationError, setNavigationError] = useState("");
 const activeSort = pending ? target.sort : sort;
 const activeQuery = pending ? target.query : query;
 const url = (nextSort: Sort, nextPage = 1, nextQuery = activeQuery) => `/explore?${new URLSearchParams({ sort: nextSort, ...(nextQuery ? { q: nextQuery } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) })}`;
 function navigate(nextSort: Sort, nextPage = 1, nextQuery = activeQuery, refresh = false) {
  setTarget({ sort: nextSort, page: nextPage, query: nextQuery }); setNavigationError("");
  startTransition(() => {
   try {
    if (refresh || (!pending && url(nextSort, nextPage, nextQuery) === url(sort, page, query))) router.refresh();
    else router.push(url(nextSort, nextPage, nextQuery), { scroll: false });
   } catch { setNavigationError("The gallery couldn’t be loaded. Try again."); }
  });
 }
 function follow(event: MouseEvent<HTMLAnchorElement>, nextSort: Sort, nextPage = 1) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  event.preventDefault(); navigate(nextSort, nextPage);
 }
 return <>
  <div className="explore-toolbar"><nav aria-label="Sort memes" className="segmented-tabs">{tabs.map(tab => <Link href={url(tab.key)} prefetch={false} key={tab.key} aria-current={activeSort === tab.key ? "page" : undefined} onClick={event => follow(event, tab.key)}><tab.icon size={17}/>{tab.label}</Link>)}</nav><form className="search-form" action="/explore" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); navigate(activeSort, 1, String(form.get("q") ?? "").trim().slice(0, 80)); }}><MagnifyingGlass size={19}/><input aria-label="Search captions or creators" name="q" defaultValue={query} key={query} placeholder="Search captions or @creators" maxLength={80}/><input type="hidden" name="sort" value={activeSort}/><button type="submit" aria-label="Search"><ArrowRight size={18}/></button></form></div>
  {activeQuery && <p className="search-summary">Results for “{activeQuery}” <Link href="/explore">Clear search</Link></p>}
  <div className={styles.results} role="region" aria-label="Explore results" aria-busy={pending}>
   {pending ? <div className={styles.loading}><p role="status">Loading {tabs.find(tab => tab.key === activeSort)?.label} memes…</p><div className={styles.skeletons} aria-hidden="true">{[0,1,2,3,4,5].map(index => <div key={index}/>)}</div></div> : <>{navigationError && <p role="alert" className="form-message">{navigationError}</p>}{children}{(failed || navigationError) && <button className="secondary-button" type="button" onClick={() => navigationError ? navigate(target.sort, target.page, target.query) : navigate(sort, page, query, true)}>Try loading again</button>}
    {!failed && <nav className="gallery-pagination" aria-label="Gallery pages">{page > 1 && <Link className="secondary-button" prefetch={false} href={url(sort, page - 1)} onClick={event => follow(event, sort, page - 1)}><ArrowLeft size={17}/>Previous</Link>}{hasMore && <Link className="secondary-button" prefetch={false} href={url(sort, page + 1)} onClick={event => follow(event, sort, page + 1)}>More memes <ArrowRight size={17}/></Link>}</nav>}
   </>}
  </div>
 </>;
}
