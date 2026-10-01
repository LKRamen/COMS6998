import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { isProfileComplete, readProfile } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let complete = false;
        try {
          complete = isProfileComplete(await readProfile(supabase, user.id));
        } catch {
          // Profile page provides a retryable error if setup is incomplete.
        }
        const response = NextResponse.redirect(new URL(complete ? "/members" : "/profile", request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", request.url));
}
