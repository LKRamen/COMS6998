"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin");
  if (!origin) redirect("/login?error=signin");
  // Keep the PKCE verifier and provider return on the registered production host.
  // Deployment-specific hosts may not be in Supabase's redirect allow list.
  const productionOrigin = "https://coms-6998-theta.vercel.app";
  if (new URL(origin).hostname.endsWith(".vercel.app") && origin !== productionOrigin) {
    redirect(`${productionOrigin}/login`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=signin");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/profile?error=signout");
  redirect("/");
}
