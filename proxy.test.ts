// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
vi.mock("@supabase/ssr", () => ({createServerClient:vi.fn()}));
import { proxy } from "./proxy";
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
it("recovers a code delivered to the site root without rendering the guest homepage or consuming its PKCE cookies", async () => {
 const request = new NextRequest("https://app.test/?code=returned-code", { headers: {cookie:"sb-pkce=verifier"} });
 const response = await proxy(request);
 expect(response.headers.get("location")).toBe("https://app.test/auth/callback?code=returned-code");
 expect(response.headers.get("cache-control")).toContain("no-store");
 expect(request.cookies.get("sb-pkce")?.value).toBe("verifier");
});
it("lets the callback exchange its code before refreshing an old session can clear PKCE verifiers", async () => {
 vi.mocked(createServerClient).mockClear();
 vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
 vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key");
 vi.mocked(createServerClient).mockImplementation(() => { throw new Error("Callback must exchange before refreshing a stale session"); });
 const response = await proxy(new NextRequest("https://app.test/auth/callback?code=returned-code&sb_flow_id=0123456789abcdef", { headers: { cookie: "sb-auth-token=stale-session; sb-code-verifier=pending-verifier" } }));
 expect(createServerClient).not.toHaveBeenCalled();
 expect(response.headers.get("x-middleware-next")).toBe("1");
 expect(response.headers.get("set-cookie")).toBeNull();
 expect(response.headers.get("cache-control")).toContain("no-store");
});
