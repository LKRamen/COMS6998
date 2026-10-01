"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCompleteProfile } from "../../lib/auth";
import { isCountryCode } from "../../lib/countries";

export async function addVisit(form: FormData) {
  const { supabase, user } = await requireCompleteProfile();
  const code = form.get("country_code");
  if (!isCountryCode(code)) redirect("/members?error=country");
  const { error } = await supabase.from("country_visits").insert({ user_id: user.id, country_code: code });
  if (error && error.code !== "23505") redirect("/members?error=save");
  revalidatePath("/");
  revalidatePath("/members");
  redirect("/members?saved=1");
}

export async function removeVisit(form: FormData) {
  const { supabase, user } = await requireCompleteProfile();
  const code = form.get("country_code");
  if (!isCountryCode(code)) redirect("/members?error=country");
  const { error } = await supabase.from("country_visits").delete().eq("user_id", user.id).eq("country_code", code);
  if (error) redirect("/members?error=save");
  revalidatePath("/");
  revalidatePath("/members");
  redirect("/members?removed=1");
}
