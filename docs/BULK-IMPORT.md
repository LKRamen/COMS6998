# Authorized one-time meme import

This local command seeds images across the user's **two existing accounts**, after the user supplies the folder and confirms account handles. It bypasses the website upload flow only for this explicitly authorized import. It does not change RLS, add an application bypass, send emails, call Gemini, or create accounts. No importer is exposed through a website route.

Captions must be genuinely authored by the assistant **after inspecting each image**. Save the actual effective prompt, actual model identifier and truthful provenance. Do not label assistant captions as Gemini outputs or fabricate engagement.

## Prepare

1. Finish choosing both usernames in the app. Record their actual account UUIDs and exact usernames.
2. Inspect the supplied image folder, author three distinct captions per image, and choose one. Each caption must contain 1–240 characters.
3. Save a JSON manifest under `work/`. Keep it private: it includes local filenames and private generation prompts. Do not commit credentials, tokens, or unapproved image material.

Manifest structure (replace every bracketed field before running):

```json
{
  "folder": "C:\\absolute\\path\\to\\supplied-images",
  "accounts": [
    { "id": "[first existing account UUID]", "username": "[first chosen handle]" },
    { "id": "[second existing account UUID]", "username": "[second chosen handle]" }
  ],
  "items": [
    {
      "owner": "[one of the account UUIDs above]",
      "file": "relative-image-name.jpg",
      "captions": ["[actual caption 1]", "[actual caption 2]", "[actual caption 3]"],
      "selected": 1,
      "style": "Brainrot",
      "prompt": "[actual effective prompt used when inspecting this image and writing captions]",
      "model": "[actual OpenAI model identifier]",
      "provenance": "[truthful assistant/session origin, image-inspection confirmation and user authorization]"
    }
  ]
}
```

Supported styles match the app. Images must be still JPEG/PNG/WebP, nonempty, at most 5 MiB and at most 20 megapixels. Relative paths are resolved against the real folder; traversal and symlink escapes are rejected. Source images are normalized with the app's metadata-stripping normalizer, and published images use the app's bundled-font renderer.

## Validate, then apply

From the repository root, use Node **24** and the repository's existing `.env`:

```powershell
node --conditions=react-server --env-file=.env scripts/bulk-import.mjs --manifest work/bulk-manifest.json
node --conditions=react-server --env-file=.env scripts/bulk-import.mjs --manifest work/bulk-manifest.json --apply
```

Dry-run is the default and makes no external writes. It validates every image, caption, rendered image/font, account identity, username confirmation and existing import state before any publication. It requires the existing Supabase URL, publishable/anon key and server-only service key. The target project is pinned to the existing `swmgfanscadzfkqoctle` project.

Apply runs serially. The private local command uses the server credential to insert an owned private draft, immutable `bulk-v1` generation provenance and three caption rows. It obtains a temporary normal session for the correct existing account through `generateLink` / `verifyOtp` (no email sent), then calls the ordinary ownership-checked `brainrot_publish` RPC. Tokens stay in memory and temporary sessions are signed out locally. Existing user sessions remain active.

## Retry and verify

IDs are deterministic from the owner and original image SHA-256. Each generation stores the original/normalized image hashes and a fingerprint of the captions, selected ordinal, style, prompt, model and provenance. An identical rerun reuses completed publications and resumes partial private state. Changed captions/provenance, edited partial drafts, mismatched owners or differing stored image bytes fail without replacing existing content. To revise a published result, use a separate deliberate product change rather than editing this manifest.

Failures are listed by meme ID; private partial rows/assets remain available for retry with the **unchanged** manifest. There is no automatic historical-data deletion. The command prints a summary and persistent meme URLs, never tokens or secret values. A nonzero exit signals failed items. Keep the execution summary as evidence, then verify the published URLs, creator attribution and real voteability in the app.

Boundary tests:

```powershell
npx vitest run scripts/bulk-import-input.node-test.mjs
```
