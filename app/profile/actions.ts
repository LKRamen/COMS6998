"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, readProfile } from "../../lib/auth";

const imageExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveProfile(form: FormData) {
  const { supabase, user } = await requireUser();
  const firstName = String(form.get("first_name") ?? "").trim();
  const lastName = String(form.get("last_name") ?? "").trim();
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) redirect("/profile?error=names");
  const photo = form.get("photo");
  const oldProfile = await readProfile(supabase, user.id);
  let avatarPath = oldProfile?.avatar_path ?? null;
  let uploadedPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const extension = imageExtensions[photo.type];
    if (!extension || photo.size > 2 * 1024 * 1024) redirect("/profile?error=photo");
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, photo, { contentType: photo.type, upsert: false });
    if (error) redirect("/profile?error=upload");
    uploadedPath = path;
    avatarPath = path;
  }
  const { data, error } = await supabase.from("profiles")
    .update({ first_name: firstName, last_name: lastName, avatar_path: avatarPath })
    .eq("id", user.id).select("id").maybeSingle();
  if (error || !data) {
    if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
    redirect("/profile?error=save");
  }
  if (uploadedPath && oldProfile?.avatar_path) await supabase.storage.from("avatars").remove([oldProfile.avatar_path]);
  revalidatePath("/profile");
  revalidatePath("/members");
  redirect("/profile?saved=1");
}
