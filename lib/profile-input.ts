export function parseCreatorProfile(input: { username: unknown; display_name: unknown; bio: unknown }) {
 const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
 const display_name = typeof input.display_name === "string" ? input.display_name.trim() : "";
 const bio = typeof input.bio === "string" ? input.bio.trim() : "";
 if (!/^[a-z0-9_]{3,40}$/.test(username)) throw new Error("Use 3–40 letters, numbers or underscores for your username.");
 if (!display_name || display_name.length > 80) throw new Error("Use 1–80 characters for your display name.");
 if (bio.length > 240) throw new Error("Keep your bio under 240 characters.");
 return { username, display_name, bio };
}
