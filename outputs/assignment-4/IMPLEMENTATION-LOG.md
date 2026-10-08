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
