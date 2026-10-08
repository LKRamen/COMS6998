"use client";

import Link from "next/link";

export default function CreationError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
 return <main className="travel-page"><div className="travel-frame">
  <header className="caption-heading"><div><p className="eyebrow">YOUR CAPTION STUDIO</p><h1>Let’s try again<span>.</span></h1></div></header>
  <section className="upload-card">
   <p className="form-message" role="alert">This creation couldn’t be loaded. Please try again.</p>
   <p>Any changes that haven’t been saved may need to be entered again.</p>
   <div className="draft-actions"><button className="button" type="button" onClick={retry}>Try again</button><Link href="/creations">My creations</Link><Link href="/">Back to feed</Link></div>
  </section>
 </div></main>;
}
