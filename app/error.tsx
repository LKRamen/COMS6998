"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="account-page"><div className="account-card">
    <h1>We couldn’t load this page.</h1>
    <p className="page-intro">Please try again in a moment.</p>
    <button type="button" className="button" onClick={reset}>Try again</button>
    <p className="account-link"><Link href="/">Back to population rankings</Link></p>
  </div></main>;
}
