import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../lib/auth";
import { signInWithGoogle } from "../auth/actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const profile = await readProfile(supabase, user.id);
    redirect(isProfileComplete(profile) ? "/members" : "/profile");
  }
  const { error } = await searchParams;
  return <main className="account-page"><div className="account-card">
    <p className="eyebrow">BEEN THERE / YOUR ACCOUNT</p>
    <h1>Welcome back.</h1>
    <p className="page-intro">Sign in to manage your profile and track the countries you’ve visited. New here? Your Google account gets you started.</p>
    {error && <p role="alert" className="form-message">Sign-in could not be completed. Please try again.</p>}
    <form action={signInWithGoogle}><button className="button" type="submit">Continue with Google</button></form>
    <p className="account-link"><Link href="/">Back to community map</Link></p>
  </div></main>;
}
