import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { discover } from "../../../lib/memes";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
 const params = new URL(request.url).searchParams;
 const sort = params.get("sort") ?? "trending", offset = Number(params.get("offset") ?? 0);
 if ((sort !== "new" && sort !== "top" && sort !== "trending") || !Number.isInteger(offset) || offset < 0 || offset > 10000) {
  return NextResponse.json({ error: "Choose a valid gallery and position." }, { status: 400, headers });
 }
 const query = (params.get("q") ?? "").trim().slice(0, 80).replace(/^@/, "");
 try {
  const posts = await discover(await createClient(), { sort, query, offset });
  return NextResponse.json({ posts, nextOffset: offset + posts.length, hasMore: posts.length === 20 && offset + posts.length <= 10000 }, { headers });
 } catch { return NextResponse.json({ error: "More memes couldn’t be loaded. Try again." }, { status: 503, headers }); }
}
