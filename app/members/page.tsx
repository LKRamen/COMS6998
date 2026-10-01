import Link from "next/link";
import { requireCompleteProfile } from "../../lib/auth";
import { signOut } from "../auth/actions";

export default async function Members() {
  const { profile } = await requireCompleteProfile();
  return <main className="account-page"><div className="account-card">
    <p className="eyebrow">WORLD POPULATION / MEMBERS</p>
    <h1>Welcome, {profile.first_name}.</h1>
    <p className="page-intro">You’re in. This members area is available to signed-in users who have completed their profile.</p>
    <section className="member-note"><h2>A world in numbers</h2><p>The world’s population passed eight billion in 2022. Explore the public rankings to see how people are distributed across the most populous countries.</p></section>
    <nav className="account-links" aria-label="Account"><Link href="/profile">Edit your profile</Link><Link href="/">Explore the rankings</Link><form action={signOut}><button className="text-button" type="submit">Sign out</button></form></nav>
  </div></main>;
}
