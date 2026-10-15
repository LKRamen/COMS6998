// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getAll: vi.fn(), set: vi.fn(), create: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.create }));
import { createClient } from "./server";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL","https://project.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","public-key"); });
it("passes PKCE verifier cookies into the client and writes all exchanged session cookie chunks with their options", async () => {
 mocks.getAll.mockReturnValue([{name:"sb-code-verifier",value:"verifier"}]);
 await createClient();
 const adapter = mocks.create.mock.calls[0][2].cookies;
 expect(adapter.getAll()).toEqual([{name:"sb-code-verifier",value:"verifier"}]);
 adapter.setAll([{name:"sb-auth.0",value:"first",options:{path:"/",sameSite:"lax",secure:true}},{name:"sb-auth.1",value:"second",options:{path:"/",sameSite:"lax",secure:true}}]);
 expect(mocks.set).toHaveBeenNthCalledWith(1,"sb-auth.0","first",{path:"/",sameSite:"lax",secure:true});
 expect(mocks.set).toHaveBeenNthCalledWith(2,"sb-auth.1","second",{path:"/",sameSite:"lax",secure:true});
});
