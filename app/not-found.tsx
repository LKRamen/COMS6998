import Link from "next/link";
import AppShell from "./components/app-shell";
export default function NotFound() { return <AppShell signedIn={false}><main className="page-error"><p className="overline">404 / LOST IN THE SCROLL</p><h1>This one got away.</h1><p>The meme or creator you’re looking for isn’t here. There’s plenty more where that came from.</p><Link href="/explore" className="button">Back to Explore</Link></main></AppShell>; }
