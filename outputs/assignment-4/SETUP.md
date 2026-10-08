# Assignment 4 setup and release handoff

The required MCP server and private application key are verified. The caption migration is applied, and hosted API integration passed on 2026-10-08. Signed-in browser acceptance, PM feedback and final deployment remain pending.

## Connect the required Supabase MCP server

`supabase-coms6998` is connected and scoped to `swmgfanscadzfkqoctle`. The project URL and application service key were verified with a successful API request. The caption migration is recorded as `20261008112237_caption_community`.

Use only this scoped MCP server for future live database changes. The earlier restart/token blocker is resolved. Never paste credentials into chat.

## Private application environment

The ignored project `.env` contains the Gemini key and `SUPABASE_SERVICE_ROLE_KEY`; neither value was printed or committed. MCP authentication and the application key are separate credentials.

`GEMINI_MODEL` is now `gemini-3.5-flash`: two actual provider calls returned valid captions and saved hosted batches. The former 3.8 model returned HTTP 503 during integration; 2.5 returned HTTP 404 and reported it was unavailable to new users. See `HOSTED-API-VERIFICATION.json`. Google lists a free tier for 3.5 Flash; the actual account billing/quota configuration remains the user's responsibility. No billing upgrades were made. [Google pricing](https://ai.google.dev/gemini-api/docs/pricing)

Set the same private environment values and model on Vercel before deploying. Never use a `NEXT_PUBLIC_` prefix for server keys.

## Database integration

The following initial integration work is complete; retain these steps for future changes:

1. Use only `supabase-coms6998` to inspect existing schemas, tables, policies, functions and migrations before applying changes. Confirm the existing profile columns and first-name/last-name rules match the migration.
2. Audit RLS on every existing exposed table, including assignment-3 tables, and preserve the original travel functionality. The live audit confirmed all ten application tables in `public` have RLS enabled; existing profile and travel policies remain owner-only where appropriate. Managed internal Auth/Realtime/Vault schemas were not altered.
3. Review/apply `supabase/migrations/202610080001_caption_community.sql` using the scoped server. It creates a private photo bucket and narrowly granted transaction functions for votes, drafts, publication, quota and cleanup.
4. Adapt `database-verification.sql` to designated test-account IDs. Its synthetic profile inserts are for the isolated harness; do not insert invented accounts into the hosted Auth schema. Verify database transactions using rollback and examine security/performance advisors.
5. Verify private Storage ownership and guest published-image access through the real API, including expired URLs. Concurrent HTTP generation reservations and vote requests passed. Simultaneous photo replacement and publication/deletion races still need further hosted checks; isolated single-connection tests cannot establish those results.

The additional `database-regressions.sql` covers stale/expired generation, exact photo/request provenance and private/public Storage policies in the isolated harness. Adapt its Auth fixtures before any hosted run.

For disposable local SQL checks, install PGlite under `work/sql-check` and run `scripts/check-caption-database.mjs`. It stubs Auth and Storage only inside an isolated in-memory database.

## End-to-end acceptance and deployment

Use two complete-profile accounts and an incognito guest. Test upload, automatic draft saving/reload, three-caption generation, regeneration history, selected-batch publication, one net score, vote change/removal, no self-vote, deletion/cleanup retry, five successful daily batches and unchanged atlas functionality. Provider failures must not consume a successful batch. Include different photos, large accepted source files and replacement during generation.

After successful integration, run tests, lint, type checking and build, get the PM feedback, and iterate. Add private environment values to Vercel, authorize release, disable deployment protection as required by the assignment, and verify the commit-specific deployment in incognito. Do not submit the current local branch as a completed deployment.
