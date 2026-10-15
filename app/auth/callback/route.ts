import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
  const response = NextResponse.redirect(new URL("/login?error=callback", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
