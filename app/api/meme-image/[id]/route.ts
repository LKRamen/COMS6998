import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { isUuid } from "../../../../lib/caption-input";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!isUuid(id)) return new NextResponse("Not found", { status: 404 });
 const client = await createClient();
 const { data, error } = await client.rpc("brainrot_discover", { p_id: id });
 const post = data?.[0];
 if (error) return new NextResponse("Photo temporarily unavailable", { status: 503 });
 if (!post) return new NextResponse("Not found", { status: 404 });
 const path = new URL(request.url).searchParams.get("source") === "1" ? post.photo_path : post.rendered_path || post.photo_path;
 const { data: image, error: imageError } = await client.storage.from("caption-photos").createSignedUrl(path, 300);
 if (imageError || !image) return new NextResponse("Photo unavailable", { status: 503 });
 const response = NextResponse.redirect(image.signedUrl);
 response.headers.set("Cache-Control", "no-store");
 return response;
}
