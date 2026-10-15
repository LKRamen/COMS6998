import { after, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../../lib/auth";
import { getGenerationJobs, prepareGeneration } from "../../../lib/generation-jobs";
import { isSameOriginRequest } from "../../../lib/request-origin";
export const runtime = "nodejs";
export const maxDuration = 60;
const noStore = { "Cache-Control": "private, no-store" };

export async function GET() {
 const client = await createClient();
 const { data: { user } } = await client.auth.getUser();
 if (!user) return NextResponse.json({ error: "Sign in to see your generations." }, { status: 401, headers: noStore });
 try { return NextResponse.json({ jobs: await getGenerationJobs(user.id) }, { headers: noStore }); }
 catch { return NextResponse.json({ error: "Generation status could not be loaded. Try again shortly." }, { status: 503, headers: noStore }); }
}

export async function POST(request: Request) {
 if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Please submit from this website." }, { status: 403 });
 const client = await createClient();
 const { data: { user } } = await client.auth.getUser();
 if (!user) return NextResponse.json({ error: "Sign in to generate captions." }, { status: 401, headers: noStore });
 try {
  if (!isProfileComplete(await readProfile(client, user.id))) return NextResponse.json({ error: "Choose your username before creating a meme." }, { status: 403, headers: noStore });
  if (Number(request.headers.get("content-length")) > 1024) throw new Error("This request is too large.");
  const body = await request.text(); if (body.length > 1024) throw new Error("This request is too large.");
  const { momentId, requestKey } = JSON.parse(body);
  const prepared = await prepareGeneration(client, user.id, momentId, requestKey);
  // Next/Vercel keeps this invocation alive independently of navigation or a closed tab.
  if (!prepared.reservation.reused) after(async () => { await prepared.perform(); });
  return NextResponse.json({ ok: true, job: prepared.reservation }, { status: prepared.reservation.state === "pending" ? 202 : 200, headers: noStore });
 } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Generation could not start. Your draft is saved." }, { status: 400, headers: noStore }); }
}
