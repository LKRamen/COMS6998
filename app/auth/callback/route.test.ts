// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ exchange: vi.fn(), getUser: vi.fn(), profile: vi.fn(), setCookie: vi.fn() }));
vi.mock("../../../lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchange, getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }) }) }));
import { GET } from "./route";
beforeEach(() => { vi.clearAllMocks(); mocks.exchange.mockResolvedValue({error:null}); mocks.getUser.mockResolvedValue({ data: { user: {id:"owner"} }, error:null }); mocks.profile.mockResolvedValue({data:{ username:"ada",display_name:"Ada",username_claimed:true },error:null}); });
it("returns complete Google accounts directly to the feed", async () => { expect((await GET(new NextRequest("https://app.test/auth/callback?code=valid"))).headers.get("location")).toBe("https://app.test/feed"); });
it("takes new Google accounts to explicit onboarding", async () => { mocks.profile.mockResolvedValue({data:null,error:null}); expect((await GET(new NextRequest("https://app.test/auth/callback?code=valid"))).headers.get("location")).toBe("https://app.test/onboarding"); });
it("preserves authenticated users when profile loading fails", async () => { mocks.profile.mockResolvedValue({data:null,error:{message:"outage"}}); const response = await GET(new NextRequest("https://app.test/auth/callback?code=valid")); expect(response.headers.get("location")).toBe("https://app.test/onboarding?error=profile"); expect(response.headers.get("cache-control")).toContain("no-store"); });
it("rejects an invalid authorization code", async () => { mocks.exchange.mockResolvedValue({error:{message:"expired"}}); expect((await GET(new NextRequest("https://app.test/auth/callback?code=bad"))).headers.get("location")).toBe("https://app.test/login?error=callback"); });
it("does not trust external next redirects", async () => { expect((await GET(new NextRequest("https://app.test/auth/callback?code=valid&next=//evil.test"))).headers.get("location")).toBe("https://app.test/feed"); });
