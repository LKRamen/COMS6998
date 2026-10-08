// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("../../../lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: auth } }) }));
vi.mock("../../../lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("../../../lib/caption-photo", () => ({ normalizePhoto: vi.fn() }));
vi.mock("../../../lib/auth", () => ({ readProfile: vi.fn(), isProfileComplete: vi.fn() }));
import { POST } from "./route";
describe("upload security", () => {
 it("rejects cross-origin requests before touching authentication or upload", async () => {
  const result = await POST(new Request("https://example.com/api/caption-photo", { method: "POST", headers: { origin: "https://attacker.example" } }));
  expect(result.status).toBe(403); expect(auth).not.toHaveBeenCalled();
 });
 it("rejects unauthenticated uploads", async () => {
  auth.mockResolvedValue({ data: { user: null } });
  const result = await POST(new Request("https://example.com/api/caption-photo", { method: "POST", headers: { origin: "https://example.com" } })); expect(result.status).toBe(401);
 });
});
