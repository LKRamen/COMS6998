import { expect, it } from "vitest";
import { isSameOriginRequest } from "./request-origin";
it("accepts the external host when Next uses localhost internally", () => {
 expect(isSameOriginRequest(new Request("http://localhost:3120/api/caption-photo", { headers: { host: "127.0.0.1:3120", origin: "http://127.0.0.1:3120" } }))).toBe(true);
});
it("rejects missing, malformed, cross-host and cross-protocol origins", () => {
 for (const origin of ["", "null", "https://attacker.test", "http://app.test"]) expect(isSameOriginRequest(new Request("https://app.test/api/caption-photo", { headers: { host: "app.test", origin } }))).toBe(false);
});
