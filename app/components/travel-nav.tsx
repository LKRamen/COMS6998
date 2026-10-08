import Link from "next/link";
import { signOut } from "../auth/actions";
export default function TravelNav({ signedIn, current }: { signedIn: boolean; current: "community" | "personal" | "feed" | "create" | "creations" }) {
  return <nav className="travel-nav" aria-label="Main navigation">
    <Link className="wordmark" href="/">Been there<span>.</span></Link>
    <div className="travel-nav-links"><Link href="/" aria-current={current === "feed" ? "page" : undefined}>Feed</Link>
      {signedIn && <><Link href="/create" aria-current={current === "create" ? "page" : undefined}>Create</Link><Link href="/creations" aria-current={current === "creations" ? "page" : undefined}>My creations</Link></>}
      <Link href="/atlas" aria-current={current === "community" ? "page" : undefined}>Travel atlas</Link>
      {signedIn ? <>{(current === "community" || current === "personal") && <Link href="/members" aria-current={current === "personal" ? "page" : undefined}>My travels</Link>}<Link href="/profile">Profile</Link><form action={signOut}><button className="nav-signout">Sign out</button></form></> : <Link className="nav-login" href="/login">Sign in <span aria-hidden="true">↗</span></Link>}
    </div>
  </nav>;
}
