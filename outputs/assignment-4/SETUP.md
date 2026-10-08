# Assignment 4 setup and release handoff

Local implementation is ready for infrastructure integration. The live caption schema has not been applied and the complete application is not yet deployed or verified end to end.

## Connect the required Supabase MCP server

The existing Codex configuration at `C:\Users\lkrah\.codex\config.toml` already includes `supabase-coms6998`, restricted to project `swmgfanscadzfkqoctle` and the database feature group. The existing project access token was saved privately to the Windows User environment as `COMS6998_SUPABASE_ACCESS_TOKEN`. Its acceptance by Supabase has not yet been verified.

1. Fully quit Codex, including any remaining app process, then relaunch it and reopen this project/chat. The running session still reports that the token variable is missing because it started before the variable was configured.
2. Ask Codex to verify that `supabase-coms6998` loads and is scoped to the class project. Do not add a generic Supabase connection as a substitute.
3. If the token is rejected, check its validity in Supabase. OAuth is an alternative: remove only this server's bearer-token setting before running `codex mcp login supabase-coms6998`, complete browser sign-in, and reopen Codex. A configured invalid bearer token must not remain in place and override OAuth.

The server setup exists already; the immediate next step is restarting Codex, not creating another connection. Never paste credentials into chat.

## Private application environment

The user's Gemini credential file was parsed and the key saved in the ignored project `.env`. `GEMINI_MODEL` is configured locally as `gemini-3.8-flash`. The actual application provider module successfully returned three distinct valid captions from a synthetic photo in 16.8 seconds; metadata is in `GEMINI-SMOKE.json`. Earlier requests timed out, so provider latency remains a practical failure case. The app saves the draft and does not charge a successful batch on failure. This check did not save a hosted database batch or verify the account's billing/quota configuration.

The app also needs `SUPABASE_SERVICE_ROLE_KEY` in its ignored `.env`. Open project `swmgfanscadzfkqoctle` in the Supabase dashboard, open its API key settings, copy its server/service-role key and add `SUPABASE_SERVICE_ROLE_KEY=<key>` to this project's ignored `.env`, then save it locally; never paste it in chat or use a `NEXT_PUBLIC_` prefix. `.env.example` lists required variable names. The service key permits only server code to normalize/store photos and reserve/finalize validated generation batches; user voting/publishing/deletion use the authenticated session.

MCP authentication and the application service key are separate credentials.

## Database integration

1. Use only `supabase-coms6998` to inspect existing schemas, tables, policies, functions and migrations before applying changes. Confirm the existing profile columns and first-name/last-name rules match the migration.
2. Audit RLS on every existing exposed table, including assignment-3 tables, and preserve the original travel functionality. The prepared migration enables RLS on all six new tables; existing-table coverage still requires a live audit.
3. Review/apply `supabase/migrations/202610080001_caption_community.sql` using the scoped server. It creates a private photo bucket and narrowly granted transaction functions for votes, drafts, publication, quota and cleanup.
4. Adapt `database-verification.sql` to designated test-account IDs. Its synthetic profile inserts are for the isolated harness; do not insert invented accounts into the hosted Auth schema. Verify database transactions using rollback and examine security/performance advisors.
5. Verify private Storage ownership and guest published-image access through the real API, including expired URLs. Verify simultaneous quota, photo replacement, publication/deletion and vote requests using separate connections; the isolated single-connection tests cannot establish those results.

The additional `database-regressions.sql` covers stale/expired generation, exact photo/request provenance and private/public Storage policies in the isolated harness. Adapt its Auth fixtures before any hosted run.

For disposable local SQL checks, install PGlite under `work/sql-check` and run `scripts/check-caption-database.mjs`. It stubs Auth and Storage only inside an isolated in-memory database.

## End-to-end acceptance and deployment

Use two complete-profile accounts and an incognito guest. Test upload, automatic draft saving/reload, three-caption generation, regeneration history, selected-batch publication, one net score, vote change/removal, no self-vote, deletion/cleanup retry, five successful daily batches and unchanged atlas functionality. Provider failures must not consume a successful batch. Include different photos, large accepted source files and replacement during generation.

After successful integration, run tests, lint, type checking and build, get the PM feedback, and iterate. Add private environment values to Vercel, authorize release, disable deployment protection as required by the assignment, and verify the commit-specific deployment in incognito. Do not submit the current local branch as a completed deployment.
