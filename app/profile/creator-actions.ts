"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../lib/auth";
import { parseCreatorProfile } from "../../lib/profile-input";
import { normalizePhoto } from "../../lib/caption-photo";
export async function saveCreatorProfile(form: FormData) {
 const { supabase, user } = await requireUser();
 let uploaded: string | null = null;
 let errorCode: string | null = null;
 try {
  const fields = parseCreatorProfile({ username: form.get("username"), display_name: form.get("display_name"), bio: form.get("bio") });
  const old = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  if (old.error) throw new Error("save");
  let avatarPath = form.get("show_avatar") === "on" ? old.data?.avatar_path ?? null : null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size) {
   if (photo.size > 2 * 1024 * 1024) throw new Error("photo");
   const bytes = await normalizePhoto(photo);
   if (bytes.length > 2 * 1024 * 1024) throw new Error("photo");
   const path = `${user.id}/${crypto.randomUUID()}.jpg`;
   const result = await supabase.storage.from("avatars").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
   if (result.error) throw new Error("upload");
   uploaded = path;
   if (form.get("show_avatar") === "on") avatarPath = path;
   else throw new Error("visibility");
  }
  const result = await supabase.rpc("brainrot_save_profile", { p_username: fields.username, p_display_name: fields.display_name, p_bio: fields.bio, p_avatar_path: avatarPath });
  if (result.error) throw new Error(result.error.code === "23505" ? "username" : "save");
  revalidatePath("/profile"); revalidatePath("/profile/[username]", "page"); revalidatePath("/explore"); revalidatePath("/feed");
 } catch (error) {
  if (uploaded) await supabase.storage.from("avatars").remove([uploaded]);
  const message = error instanceof Error ? error.message : "save";
  errorCode = ["photo", "upload", "visibility", "username", "save"].includes(message) ? message : "fields";
 }
 redirect(errorCode ? `/profile?error=${errorCode}` : "/profile?saved=1");
}
