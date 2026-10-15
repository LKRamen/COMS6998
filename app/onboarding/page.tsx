import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, isProfileComplete, readProfile } from "../../lib/auth";
import { signOut } from "../auth/actions";
import AppShell from "../components/app-shell";
import OnboardingForm from "./onboarding-form";

export default async function Onboarding() {
 const { supabase, user } = await requireUser();
 let profile;
 try { profile = await readProfile(supabase, user.id); }
 catch {
  return <AppShell signedIn><main className="creator-settings"><section className="state-panel" role="alert"><h1>Your account is signed in.</h1><p>Your profile couldn’t be loaded. Please try again.</p><Link href="/onboarding" className="button">Try again</Link><form action={signOut}><button type="submit" className="subtle-link">Sign out</button></form></section></main></AppShell>;
 }
 if (isProfileComplete(profile)) redirect("/feed");
 const displayName = profile?.display_name || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "");
 return <AppShell signedIn><main className="login-layout"><div className="login-copy"><p className="overline">YOU’RE SIGNED IN</p><h1>Make an<br/><span>entrance.</span></h1><p>Choose a name. Claim your corner. Then find your kind of funny.</p></div><section className="login-panel"><h2>One last thing.</h2><p>Choose the name people will see and your own public username.</p><OnboardingForm username={profile?.username ?? ""} displayName={displayName}/><form action={signOut}><button className="subtle-link" type="submit">Use a different Google account</button></form></section></main></AppShell>;
}
