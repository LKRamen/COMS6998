import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../../../../lib/supabase/server";
import { isUuid } from "../../../../lib/caption-input";
const unavailable = (message: string, status: number) => new NextResponse(message, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!isUuid(id)) return unavailable("Not found", 404);
 try {
  // This cache contains public pixels only. Never use the request's user session or an admin key.
  const { url, key } = supabaseConfig();
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.rpc("brainrot_discover", { p_id: id });
  const post = data?.[0];
  if (error) return unavailable("Photo temporarily unavailable", 503);
  if (!post) return unavailable("Not found", 404);
  const path = new URL(request.url).searchParams.get("source") === "1" ? post.photo_path : post.rendered_path || post.photo_path;
  const { data: image, error: imageError } = await client.storage.from("caption-photos").download(path);
  if (imageError || !image) return unavailable("Photo unavailable", 503);
  return new NextResponse(image, { headers: {
   "Content-Type": image.type || "image/jpeg", "Content-Length": String(image.size),
   "Cache-Control": "public, max-age=300, s-maxage=300", "X-Content-Type-Options": "nosniff",
  } });
 } catch { return unavailable("Photo temporarily unavailable", 503); }
}
