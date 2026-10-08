# Assignment 4 verification

Checked 2026-10-08 on local branch `codex/ai-travel-captions`.

## Verified locally

- 61 tests across 18 files passed using bundled Node 24.19 and Vitest threads. Coverage includes image/input validation, authentication, upload boundaries, vote change/removal/failure recovery, private draft autosave, old-photo prevention, current-photo regeneration history, provider rejection, request replay, feed append/deduplication and ranking refresh, and existing auth/profile/travel behavior.
- Production Next.js build passed, including TypeScript. ESLint passed without warnings or errors.
- Migration and rollback assertions passed in isolated PGlite with stubbed Auth/Storage. Coverage includes grants/RLS, private prompts/history, public projection, desired-state votes, quota, immutable publication, deletion/cleanup persistence, stale/expired generation and exact photo/request provenance. This uses one connection and does not establish hosted concurrency behavior.
- The actual application Gemini provider returned three distinct valid captions from a synthetic image in 16.8 seconds. `GEMINI-SMOKE.json` records non-secret metadata. Earlier requests timed out. Account billing/quota and a saved hosted batch remain unverified.
- Built-in browser inspection confirmed the public feed's honest missing-schema state at desktop/mobile sizes and the existing real `/atlas` community map. An isolated, visibly labelled fixture harness then exercised actual draft, vote and feed components: caption selection/preview, publication failure recovery, immediate net score, append without losing earlier cards, and mobile layout without horizontal overflow. Those fixture actions were stubs, not real database transactions.
- Independent review caught cleanup/autosave edge cases and a ranking boundary gap after score changes. Fixes and regression tests were reviewed; no remaining important findings were reported in the final reviewed changes.
- Added a private creation error boundary using the installed Next.js `retry` contract. Its regression test verifies that private error details stay hidden and retry is invoked. Desktop/mobile fixture inspection verified spaced controls and no overflow (390px viewport, 375px content width).
- Task-owned temporary QA servers were stopped, with ports 3100 and 3101 verified closed at their respective completion checks.

## Verified against the hosted project

- The scoped MCP connection and private application key are accepted. Migration `20261008112237_caption_community` applied successfully.
- All ten public application tables have RLS enabled. Existing profile/visit owner policies and public country catalogs were inspected and preserved. Internal Supabase-managed schemas were not modified.
- Both SQL rollback suites passed after adapting them to existing complete-profile account IDs and scoping Storage counts to the caption bucket. They left no persisted fixture rows.
- Real Auth sessions for two task-created disposable accounts passed private photo/draft isolation, generation reservations through separate HTTP requests, actual Gemini generation and regeneration persistence, quota/failure behavior, publication, guest/self-vote denial, vote persistence/change/removal, signed URL expiration and deletion cleanup provenance. See `HOSTED-API-VERIFICATION.json`.
- Gemini 3.5 Flash returned HTTP 200 for both actual generation calls. The app is configured to use it. Earlier 3.8 requests returned HTTP 503; 2.5 was unavailable to new users. No automatic paid fallback or billing upgrade was added.
- Actual local Next upload route passed guest/cross-origin denial, authenticated PNG-to-JPEG normalization/resize/private draft persistence and replacement cleanup ledger checks with a real hosted Auth session. See `UPLOAD-ROUTE-VERIFICATION.json`.
- Temporary accounts, captions and photos were removed; final database counts returned to two original profiles, zero moments/runs and zero caption photos. No original user data was deleted.

## Still required

- Complete signed-in browser creation/upload/editor/publication checks, then mobile inspection with live data.
- Exercise simultaneous photo replacement/publication/deletion cases against the hosted service. Reservation and vote concurrency were checked; this does not prove every race.
- Obtain PM feedback and iterate; deploy and verify the commit-specific Vercel URL in incognito with deployment protection disabled.
- Updated login copy was visually checked at 1440px and 390px; mobile content width was 390px with no horizontal overflow. The live browser is awaiting the user's Google sign-in.
- Scoped MCP exposes database tools only; a security/performance advisor tool is unavailable. Catalog/RLS/grant inspection and runtime checks were completed instead.

The caption migration and user-authorized interim production deployment are live. See DEPLOYMENT.json for commit-specific URL and production checks. Full browser generation/publication/voting and PM feedback remain pending; this interim release is not a claim that assignment acceptance is complete.
