import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const supabase = await createClient();
  let reason = "missing_code";
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    // Fixed diagnostic labels only; never include authorization codes, tokens or messages.
    reason = error?.code && ["pkce_code_verifier_not_found", "bad_code_verifier", "flow_state_not_found", "flow_state_expired"].includes(error.code) ? error.code : "exchange";
    if (!error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      reason = "session";
      if (user && !userError) {
        let complete = false;
        let profileFailed = false;
        try {
          complete = isProfileComplete(await readProfile(supabase, user.id));
        } catch {
          profileFailed = true;
        }
        const response = NextResponse.redirect(new URL(complete ? "/feed" : profileFailed ? "/onboarding?error=profile" : "/onboarding", request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    }
  }
  const response = NextResponse.redirect(new URL(`/login?error=callback&reason=${reason}`, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
