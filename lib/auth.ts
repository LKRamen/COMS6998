import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string | null;
  display_name: string | null;
  username_claimed: boolean;
  avatar_path: string | null;
};

export function isProfileComplete(profile: Pick<Profile, "username" | "display_name" | "username_claimed"> | null) {
  return Boolean(profile?.username_claimed && profile.username?.trim() && profile.display_name?.trim());
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

export async function readProfile(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data, error } = await supabase.from("profiles")
    .select("id,username,display_name,username_claimed,avatar_path").eq("id", id).maybeSingle();
  if (error) throw new Error("Your profile could not be loaded. Please try again.");
  return data as Profile | null;
}

export async function requireCompleteProfile() {
  const { supabase, user } = await requireUser();
  const profile = await readProfile(supabase, user.id);
  if (!isProfileComplete(profile)) redirect("/onboarding");
  return { supabase, user, profile: profile! };
}
