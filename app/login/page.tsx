import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { GoogleLogo } from "@phosphor-icons/react/dist/ssr/GoogleLogo";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { createClient } from "../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../lib/auth";
import { signInWithGoogle } from "../auth/actions";
import AppShell from "../components/app-shell";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
 const client = await createClient(); const { data: { user } } = await client.auth.getUser();
 if (user) {
  let complete = false;
  try { complete = isProfileComplete(await readProfile(client, user.id)); } catch { redirect("/onboarding?error=profile"); }
  redirect(complete ? "/feed" : "/onboarding");
 }
 const { error } = await searchParams;
 return <AppShell signedIn={false}><main className="login-layout"><div className="login-copy"><p className="overline"><Sparkle size={14}/> YOUR PEOPLE ARE HERE</p><h1>Good taste.<br/><span>Bad ideas.</span></h1><p>Turn a photo into a punchline. Find your kind of funny. Give the feed your honest opinion.</p></div><section className="login-panel"><h2>Welcome to the weird.</h2><p>One Google account. Your own corner of the internet. New here? We’ll create your account when you sign in.</p>{error && <p role="alert" className="form-message">Sign-in couldn’t be completed. Please try again.</p>}<form action={signInWithGoogle}><button className="button" type="submit"><GoogleLogo size={20} weight="bold"/>Continue with Google <ArrowRight size={17}/></button></form><p className="login-small">No password to remember. Your email is private, and you choose what to publish.</p><Link href="/explore" className="subtle-link">Just looking? Browse Explore</Link></section></main></AppShell>;
}
