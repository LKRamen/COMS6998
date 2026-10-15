import { createHash } from "node:crypto";
import { realpath, readFile, stat } from "node:fs/promises";
import path from "node:path";

export const hash = bytes => createHash("sha256").update(bytes).digest("hex");
export function stableId(...parts) {
 const bytes = createHash("sha256").update(JSON.stringify(["brainrot-bulk-v1", ...parts])).digest().subarray(0, 16);
 bytes[6] = (bytes[6] & 15) | 128; bytes[8] = (bytes[8] & 63) | 128;
 const hex = bytes.toString("hex");
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const uuid = value => typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
function nonempty(value, name) {
 if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required.`);
 return value.trim();
}
export function validateManifest(input) {
 if (!input || typeof input !== "object") throw new Error("Manifest must be an object.");
 const folder = nonempty(input.folder, "folder");
 if (!path.isAbsolute(folder)) throw new Error("folder must be an absolute path.");
 if (!Array.isArray(input.accounts) || input.accounts.length !== 2) throw new Error("Specify exactly two existing accounts.");
 const accounts = input.accounts.map(account => {
  if (!account || !uuid(account.id)) throw new Error("Each account needs its actual UUID.");
  const username = nonempty(account.username, "Account username").toLowerCase();
  if (!/^[a-z0-9_]{3,40}$/.test(username)) throw new Error("Invalid expected username.");
  return { id: account.id.toLowerCase(), username };
 });
 if (new Set(accounts.map(account => account.id)).size !== 2 || new Set(accounts.map(account => account.username)).size !== 2) throw new Error("Accounts and usernames must be distinct.");
 if (!Array.isArray(input.items) || !input.items.length) throw new Error("Add at least one image item.");
 const items = input.items.map((item, index) => {
  if (!item || typeof item !== "object") throw new Error(`Invalid item ${index + 1}.`);
  const owner = nonempty(item.owner, "Item owner").toLowerCase();
  if (!accounts.some(account => account.id === owner)) throw new Error("Item owner must be one of the two accounts.");
  const file = nonempty(item.file, "Image file");
  if (path.isAbsolute(file)) throw new Error("Image files must be relative to folder.");
  if (!Array.isArray(item.captions) || item.captions.length !== 3) throw new Error("Supply three distinct captions per image.");
  const captions = item.captions.map(caption => nonempty(caption, "Caption"));
  if (captions.some(caption => caption.length > 240) || new Set(captions.map(caption => caption.toLowerCase())).size !== 3) throw new Error("Captions must be distinct and at most 240 characters.");
  if (![1,2,3].includes(item.selected)) throw new Error("selected must be 1, 2 or 3.");
  const styles = ["Brainrot", "Dry sarcasm", "Absurdist", "College life", "NYC", "Relatable", "Unhinged", "Funny", "Witty", "Postcard"];
  if (!styles.includes(item.style)) throw new Error("Choose a supported style.");
  const prompt = nonempty(item.prompt, "Actual effective caption prompt");
  const model = nonempty(item.model, "Actual model identifier");
  const provenance = nonempty(item.provenance, "Caption provenance");
  if (/gemini/i.test(model)) throw new Error("This importer records assistant-authored captions, not Gemini generation.");
  return { owner, file, captions, selected: item.selected, style: item.style, prompt, model, provenance };
 });
 return { folder, accounts, items };
}
export async function readContainedImage(folder, file) {
 const base = await realpath(folder), target = await realpath(path.resolve(base, file));
 const relative = path.relative(base, target);
 if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Image path escapes the selected folder.");
 const info = await stat(target);
 if (!info.isFile() || !info.size || info.size > 5 * 1024 * 1024) throw new Error("Use a nonempty image file under 5 MiB.");
 const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[path.extname(target).toLowerCase()];
 if (!mime) throw new Error("Use JPEG, PNG or WebP images.");
 return { bytes: await readFile(target), mime };
}
export function assertMatching(existing, expected, label) {
 for (const [key, value] of Object.entries(expected)) {
  if (JSON.stringify(existing[key]) !== JSON.stringify(value)) throw new Error(`${label} conflicts at ${key}; refusing to overwrite existing content.`);
 }
}
