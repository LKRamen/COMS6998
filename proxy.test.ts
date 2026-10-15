// @vitest-environment node
import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@supabase/ssr", () => ({createServerClient:vi.fn()}));
import { proxy } from "./proxy";
it("recovers a code delivered to the site root without rendering the guest homepage or consuming its PKCE cookies", async () => {
 const request = new NextRequest("https://app.test/?code=returned-code", { headers: {cookie:"sb-pkce=verifier"} });
 const response = await proxy(request);
 expect(response.headers.get("location")).toBe("https://app.test/auth/callback?code=returned-code");
 expect(response.headers.get("cache-control")).toContain("no-store");
 expect(request.cookies.get("sb-pkce")?.value).toBe("verifier");
});
