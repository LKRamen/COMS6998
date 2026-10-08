# Implementation log

- Base: 39ac7bd. Spec approved; user explicitly requested implementation.
- Bootstrap conflict already checked; do not rerun or overwrite `.engineering`.
- Scoped Supabase MCP unavailable; its configured bearer variable was absent. Guided user to OAuth login. Gemini key/model were initially absent, then configured privately from the supplied credential file. Application service-role key remains absent.
- Execution: sequential local implementation, independent final review. Preserve all preexisting untracked assignment-3 files and AGENTS.md.
- Task 1: migration and rollback tests passed in isolated PGlite. Live scoped MCP audit/apply remains blocked.
- Task 2: strict input/image/provider checks implemented; focused tests passed. Gemini key installed from user-provided file by parsing its named assignment; key verified by models endpoint, model selected locally as gemini-3.8-flash. Secret never printed.
- Tasks 3–4: actions/upload/UI implemented. Source photo compression keeps requests below Vercel limits; server still verifies and normalizes photos. Automatic draft saving reconciles edits and reversions made during an earlier in-flight save.
- Ruling: Vitest uses threads because Windows fork workers stalled. Verification runs use bundled Node 24.19 because installed jsdom requires a newer Node than the global 22.19.
- Ruling: service-only normalized uploads preserve a strict trusted-image boundary. No ordinary browser Storage writes granted.
- Task 5: 51 tests passed, production build/type check passed, isolated database assertions passed. Desktop/mobile public error state and existing live atlas inspected through built-in Browser. Independent review completed; photo cleanup concurrency and draft autosave findings fixed. Temporary QA server stopped and port closed. Live migration, existing-table RLS audit, real generation success, private browser flows and deployment remain outstanding; see SETUP.md and VERIFICATION.md.
- Provider smoke: model discovery authenticated successfully; synthetic-image generation timed out. Do not claim generation works end to end yet.

## Follow-up verification and fixes

- Configured the existing project MCP token in the Windows User environment without exposing its value. Current Codex process still lacks it; server startup explicitly fails on the missing process variable. Full app restart is required. No generic connector or direct database workaround was used.
- Gemini 3 requests now use low thinking and a sufficient output budget; older models omit unsupported thinking settings. Malformed response bodies produce a sanitized recoverable error. Actual provider-module smoke passed: three valid distinct captions, 16.8 seconds. Earlier timeouts remain recorded as latency evidence; no hosted batch was saved.
- Regeneration history now uses only the current photo revision. Feed Load more appends cards, deduplicates IDs and refreshes appended ranking pages when scores change. Independent review caught a ranking boundary gap; regression coverage and the fix were reviewed successfully.
- Added rollback database regressions for stale/expired batches, failures without quota charge, cleanup provenance, owner/guest Storage policies and immutable publication. Successful generation rows retain the exact reserved photo path and request key.
- Final local checks: 60 tests across 17 files passed; production build/TypeScript and ESLint passed; isolated SQL migration/assertions passed. Browser fixture checks exercised actual draft, vote and feed components on desktop/mobile, with explicit stub labels. They do not establish hosted transactions.
- Independent final review found no remaining important defects in the reviewed changes. Temporary fixture QA server was stopped; port 3101 verified closed. Infrastructure integration and release remain pending.

- Private creation read failures now reach a sanitized retry screen with links back to saved creations/feed. Regression failed against an empty fallback before implementation; 61 tests/18 files then passed. Production build/type check and lint passed. Browser fixture confirmed desktop/mobile wrapping and retry interaction; task-owned session 64033 stopped and port 3101 closed. Hosted failure/recovery still requires integration.

## Hosted integration, 2026-10-08 morning

- User supplied the missing server key and enabled the scoped MCP connection. Verified the project URL/key without revealing credentials; inspected schemas/policies before applying the additive migration. All ten public application tables have RLS enabled. Both adapted hosted rollback suites passed.
- Real Auth/Storage/RPC checks passed with two disposable accounts. Successful Gemini batches and regeneration persisted exact prompts/photo/request metadata; votes persisted and remained one row under concurrent requests; quota/failure/expiration/deletion checks passed. All task-created accounts/photos/rows were cleaned up and baseline counts verified.
- Model adjustment: 3.8 returned 503; 2.5 returned 404 and a new-user restriction. 3.5 Flash returned two successful actual provider responses and is now configured locally. No billing upgrade. Report saved in HOSTED-API-VERIFICATION.json.
- Started and registered task-owned local Next server session 14220 for browser integration. User agreed to sign in; browser is at Google account selection. Browser upload/editor acceptance remains pending. Login copy now reflects caption creation/rating and links to the caption feed.

- Actual Next photo upload route passed real hosted-session checks: guest/cross-origin denial, PNG normalized to a 1600px JPEG without EXIF, saved private draft and replacement cleanup ledger. Synthetic account/photo artifacts were removed. Evidence: UPLOAD-ROUTE-VERIFICATION.json.

## Authorized interim production deployment

- User explicitly requested deploying the current version to try it after local sign-in redirected to the existing production site. Connector lacked team access; user completed CLI authorization. Confirmed existing team/project before mutation.
- Deployed a clean archive of commit 7ace6eb to the existing production project; no unrelated untracked files or .env uploaded. Server/Gemini keys added as sensitive production variables. Vercel reports READY, alias coms-6998-theta.vercel.app. Details in DEPLOYMENT.json.
- Both main and immutable deployment URLs passed cookie-free public requests. Built-in Browser displayed the new feed and the authenticated photo upload page using the user's existing production session. Production generation/publication/voting browser flows and PM feedback remain pending.

## Post-location pivot, 2026-10-08

User authorized location search, location required at publication, post-derived personal/community maps, author location corrections and production deployment. Implemented in 4a2acd0. Live migration applied through the scoped server. 72 unit/component tests, lint, production build/typecheck, isolated and live rollback map/permission checks, and real hosted Auth/Storage upload/replacement checks passed. Independent review found no blockers. User took over interactive QA; stopped further Browser work and task-owned local servers. Production deployment dpl_FZtjEYGsFJRZ6eRgCVpBVozvd4B7 READY; both public URLs pass feed/atlas/filter/place-search and guest-login checks. See LOCATION-PIVOT.md and LOCATION-DEPLOYMENT.json.

## Full-photo display, 2026-10-08

User requested either the full image or a user-controlled crop. Selected the full-image option: feed and My creations photos now use their natural aspect ratio at card width, with fixed desktop/mobile cropping heights removed. Production build/typecheck passed. No new mutation or crop editor added. Hands-on visual acceptance remains with the user under their standing preference.
