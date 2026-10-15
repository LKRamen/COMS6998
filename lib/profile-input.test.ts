import { expect, it } from "vitest";
import { parseCreatorProfile } from "./profile-input";
it("normalizes usernames and preserves the chosen public identity", () => {
 expect(parseCreatorProfile({ username: " My_Handle ", display_name: " Sam ", bio: " hello " })).toEqual({ username: "my_handle", display_name: "Sam", bio: "hello" });
});
it("rejects URL/path usernames and oversized public fields", () => {
 for (const username of ["ab", "../admin", "a b", "a".repeat(41)]) expect(() => parseCreatorProfile({ username, display_name: "Sam", bio: "" })).toThrow();
 expect(() => parseCreatorProfile({ username: "sam", display_name: "", bio: "" })).toThrow();
 expect(() => parseCreatorProfile({ username: "sam", display_name: "Sam", bio: "x".repeat(241) })).toThrow();
});
