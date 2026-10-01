import Link from "next/link";
import { signOut } from "../auth/actions";
export default function TravelNav({ signedIn, current }: { signedIn: boolean; current: "community" | "personal" }) {
  return <nav className="travel-nav" aria-label="Main navigation">
    <Link className="wordmark" href="/">Been there<span>.</span></Link>
    <div className="travel-nav-links"><Link href="/" aria-current={current === "community" ? "page" : undefined}>Community map</Link>
      {signedIn ? <><Link href="/members" aria-current={current === "personal" ? "page" : undefined}>My travels</Link><Link href="/profile">Profile</Link><form action={signOut}><button className="nav-signout">Sign out</button></form></> : <Link className="nav-login" href="/login">Start your map <span aria-hidden="true">↗</span></Link>}
    </div>
  </nav>;
}
