"use client";
import Link from "next/link";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <div className="brainrot-app"><main className="app-main"><div className="page-error">
    <h1>We couldn’t load this page.</h1>
    <p className="page-intro">Please try again in a moment.</p>
    <button type="button" className="button" onClick={retry}>Try again</button>
    <p className="account-link"><Link href="/feed">Back to the feed</Link></p>
  </div></main></div>;
}
