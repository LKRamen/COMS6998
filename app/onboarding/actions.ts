"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../lib/auth";
import { parseCreatorProfile } from "../../lib/profile-input";

export type OnboardingState = { error: string; username: string; display_name: string };
export async function finishOnboarding(_previous: OnboardingState, form: FormData): Promise<OnboardingState> {
 const { supabase, user } = await requireUser();
 const username = typeof form.get("username") === "string" ? String(form.get("username")) : "";
 const display_name = typeof form.get("display_name") === "string" ? String(form.get("display_name")) : "";
 try {
  const fields = parseCreatorProfile({ username, display_name, bio: "" });
  // Preserve existing account settings when an older account claims its handle.
  const current = await supabase.from("profiles").select("bio,public_avatar_path").eq("id", user.id).maybeSingle();
  if (current.error) return { error: "Your profile couldn’t be loaded. Please try again.", username, display_name };
  const { error } = await supabase.rpc("brainrot_save_profile", {
   p_username: fields.username, p_display_name: fields.display_name,
   p_bio: current.data?.bio ?? "", p_avatar_path: current.data?.public_avatar_path ?? null,
  });
  if (error) return { error: error.code === "23505" ? "That username is already taken. Try another." : "Your profile couldn’t be saved. Please try again.", username, display_name };
 } catch (error) {
  return { error: error instanceof Error && /^(Use |Keep )/.test(error.message) ? error.message : "Your profile couldn’t be saved. Please try again.", username, display_name };
 }
 revalidatePath("/", "layout");
 redirect("/feed");
}
