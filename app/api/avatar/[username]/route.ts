import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { publicCreator } from "../../../../lib/memes";
import { createAdminClient } from "../../../../lib/supabase/admin";
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
 const { username } = await params;
 const profile = await publicCreator(await createClient(), username);
 if (!profile?.avatar_path || !profile.avatar_path.startsWith(`${profile.id}/`)) return new NextResponse("Not found", { status: 404 });
 // This explicit public-avatar projection is the only privileged public read.
 const { data, error } = await createAdminClient().storage.from("avatars").createSignedUrl(profile.avatar_path, 300);
 if (error || !data) return new NextResponse("Avatar unavailable", { status: 503 });
 const response = NextResponse.redirect(data.signedUrl); response.headers.set("Cache-Control", "no-store"); return response;
}
