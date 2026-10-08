# Assignment 4 setup and release handoff

Local implementation is ready for infrastructure integration. The live caption schema has not been applied and the complete application is not yet deployed or verified end to end.

## Connect the required Supabase MCP server

The existing Codex configuration at `C:\Users\lkrah\.codex\config.toml` includes `supabase-coms6998`, restricted to project `swmgfanscadzfkqoctle` and the database feature group. Its configured bearer-token environment variable was absent when checked. Use Supabase OAuth to authenticate:

```powershell
codex mcp login supabase-coms6998
```

Complete the browser sign-in using the organization containing the class project. After the command reports success, restart Codex and reopen this project/chat so it can discover the newly authenticated tools. Report an error message if login fails, without sharing credentials. Do not add a generic Supabase connection as a substitute.

References: [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Supabase MCP authentication](https://supabase.com/docs/guides/ai-tools/mcp).

## Private application environment

The user's Gemini credential file was parsed and the key saved in the ignored project `.env`. A model-list request authenticated successfully. `GEMINI_MODEL` was set locally to `gemini-3.8-flash`, which appeared in that response. A synthetic-image generation smoke request timed out; successful generation and free-tier availability for this project's model remain unverified.

The app also needs `SUPABASE_SERVICE_ROLE_KEY` in its ignored `.env`. Obtain the server key from the correct project's API key settings, then save it locally; never paste it in chat or use a `NEXT_PUBLIC_` prefix. `.env.example` lists required variable names. The service key permits only server code to normalize/store photos and reserve/finalize validated generation batches; user voting/publishing/deletion use the authenticated session.

MCP authentication and the application service key are separate credentials.

## Database integration

1. Use only `supabase-coms6998` to inspect existing schemas, tables, policies, functions and migrations before applying changes. Confirm the existing profile columns and first-name/last-name rules match the migration.
2. Audit RLS on every existing exposed table, including assignment-3 tables, and preserve the original travel functionality. The prepared migration enables RLS on all six new tables; existing-table coverage still requires a live audit.
3. Review/apply `supabase/migrations/202610080001_caption_community.sql` using the scoped server. It creates a private photo bucket and narrowly granted transaction functions for votes, drafts, publication, quota and cleanup.
4. Adapt `database-verification.sql` to designated test-account IDs. Its synthetic profile inserts are for the isolated harness; do not insert invented accounts into the hosted Auth schema. Verify database transactions using rollback and examine security/performance advisors.
5. Verify private Storage ownership and guest published-image access through the real API, including expired URLs. Verify simultaneous quota, photo replacement, publication/deletion and vote requests using separate connections; the isolated single-connection tests cannot establish those results.

For disposable local SQL checks, install PGlite under `work/sql-check` and run `scripts/check-caption-database.mjs`. It stubs Auth and Storage only inside an isolated in-memory database.

## End-to-end acceptance and deployment

Use two complete-profile accounts and an incognito guest. Test upload, automatic draft saving/reload, three-caption generation, regeneration history, selected-batch publication, one net score, vote change/removal, no self-vote, deletion/cleanup retry, five successful daily batches and unchanged atlas functionality. Provider failures must not consume a successful batch. Include different photos, large accepted source files and replacement during generation.

After successful integration, run tests, lint, type checking and build, get the PM feedback, and iterate. Add private environment values to Vercel, authorize release, disable deployment protection as required by the assignment, and verify the commit-specific deployment in incognito. Do not submit the current local branch as a completed deployment.
