"use client";

import Link from "next/link";

export default function CreationError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
 return <div className="brainrot-app"><main className="app-main"><div className="page-error">
  <header><p className="overline">YOUR MEME STUDIO</p><h1>Let’s try again.</h1></header>
  <section>
   <p className="form-message" role="alert">This creation couldn’t be loaded. Please try again.</p>
   <p>Your saved draft is safe. Retry to pick up where you left off.</p>
   <div className="draft-actions"><button className="button" type="button" onClick={retry}>Try again</button><Link href="/creations">My creations</Link><Link href="/feed">Back to feed</Link></div>
  </section>
 </div></main></div>;
}
