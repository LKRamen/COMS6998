// @vitest-environment node
import { afterEach, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertMatching, hash, readContainedImage, stableId, validateManifest } from "./bulk-import-input.mjs";
const roots = [];
afterEach(async () => { for (const root of roots.splice(0)) {
 const base = path.resolve("work");
 if (!path.resolve(root).startsWith(`${base}${path.sep}`)) throw new Error("Unsafe test cleanup target");
 await rm(root, { recursive: true, force: true });
} });
const first = "876d6bd2-aa45-4873-b7a1-1706a485d53d", second = "00032198-01af-4562-97e8-1a6052b8303d";
function manifest() { return { folder: path.resolve("work"), accounts: [{ id: first, username: "owner_one" }, { id: second, username: "owner_two" }], items: [{ owner: first, file: "image.jpg", captions: ["One", "Two", "Three"], selected: 2, style: "Brainrot", prompt: "Inspect this supplied image and write three grounded captions.", model: "actual-openai-model", provenance: "Authored in the user's authorized assistant session after inspecting the image." }] }; }
it("rejects mixed-up owners and repeated or ungrounded manifest metadata before writes", () => {
 const input = manifest(); input.accounts[1].id = first;
 expect(() => validateManifest(input)).toThrow("distinct");
 const wrong = manifest(); wrong.items[0].owner = "d14298f3-bbb5-45c5-838b-edee19757dde";
 expect(() => validateManifest(wrong)).toThrow("one of the two");
 const repeated = manifest(); repeated.items[0].captions = ["one", "ONE", "three"];
 expect(() => validateManifest(repeated)).toThrow("distinct");
 const noPrompt = manifest(); noPrompt.items[0].prompt = " ";
 expect(() => validateManifest(noPrompt)).toThrow("prompt");
});
it("prevents folder traversal and sibling-prefix escapes", async () => {
 await mkdir("work", { recursive: true }); const root = await mkdtemp(path.resolve("work/bulk-input-test-")); roots.push(root);
 const folder = path.join(root, "photos"); await mkdir(folder); await mkdir(`${folder}-sibling`);
 await writeFile(path.join(folder, "inside.jpg"), "image"); await writeFile(path.join(`${folder}-sibling`, "outside.jpg"), "image");
 expect((await readContainedImage(folder, "inside.jpg")).mime).toBe("image/jpeg");
 await expect(readContainedImage(folder, "../photos-sibling/outside.jpg")).rejects.toThrow("escapes");
});
it("keeps retries stable and owners separate while refusing changed published metadata", () => {
 const fingerprint = hash(Buffer.from("image"));
 expect(stableId("meme", first, fingerprint)).toBe(stableId("meme", first, fingerprint));
 expect(stableId("meme", first, fingerprint)).not.toBe(stableId("meme", second, fingerprint));
 expect(() => assertMatching({ caption_override: "Original caption" }, { caption_override: "Changed caption" }, "Published meme")).toThrow("refusing to overwrite");
 expect(() => assertMatching({ content_fingerprint: "original" }, { content_fingerprint: "changed" }, "Generation")).toThrow("refusing to overwrite");
});
