# Been there — AI travel caption implementation spec

Date: 2026-10-08

Status: Approved by the user on 2026-10-08; implemented and verified locally. Hosted database integration, PM feedback and final deployment remain pending.

Project: `C:\Users\lkrah\COMS6998`

## 1. Purpose and success

Extend the existing travel atlas into a travel-themed photo caption community. Logged-in users upload one photo, generate caption candidates with Gemini, optionally regenerate, and publish one selected AI caption. Other logged-in users rate how well the caption fits the photo. A first vote creates a database row identifying its voter and caption.

Sam, the assignment persona, is a Columbia junior who explores NYC on weekends. Local discoveries give Sam material to post between larger trips. Photos from anywhere are welcome. New posts and reactions to their own creations provide reasons to return; community votes surface stronger content. These are product hypotheses to test during PM feedback, not established retention claims.

Success means a real user can complete creation, publication, and persistent voting on the deployed app; unauthorized reads/writes fail at the database boundary; exact generation prompts are retained; and existing travel and profile functionality survives the pivot.

## 2. Agreed product scope

| Area | Decision |
| --- | --- |
| Identity | Keep the name **Been there** and the travel theme. |
| Geography | Welcome photos from anywhere; location is optional free text. |
| Input | One uploaded photo per post, optional context, optional location. |
| Styles | Funny, Witty, Postcard. |
| Generation | Three distinct candidate captions per batch; Gemini Developer API. |
| Regeneration | Generate another batch before publishing; retain earlier batches. |
| Allowance | Five batches per user per day; initial generation and regenerations count. |
| Selection | Publish exactly one saved AI caption; no manual caption editing. |
| Drafts | Persist photo, inputs, and generation batches between visits. |
| Published content | Photo and caption cannot be edited; creator may delete their post. |
| Voting | One active upvote/downvote per user and caption; switch or remove it; no self-votes. |
| Meaning | Rate how well the caption fits the photo, across all three styles. |
| Score | One net score, upvotes minus downvotes, visible immediately to all readers. |
| Attribution | Public first name only; no public access to full profile details. |
| Feed | New by default; Top this week ranks posts published in the past seven days. |
| Privacy | Only the creator can read drafts, prompts, and unselected captions. |
| Existing maps | Secondary Travel atlas navigation; preserve travel records. |
| Safety | Handle Gemini safety blocks and validate inputs/outputs; no separate moderation service. |
| Excluded | Individual public post pages, link sharing, comments, follows, notifications, moderation dashboard, report flow, additional AI providers, generated images, and automatic map updates from posts. |

## 3. Implementation defaults for review

The following resolve engineering details, rather than introduce new product choices. They are defaults in this spec, not separately accepted discussion decisions.

- Daily allowance resets at midnight in `America/New_York`, using the database clock. Show the reset time and remaining batches. This application allowance is separate from Google's project quota.
- A saved, successful batch consumes one allowance unit. Validation failures, safety blocks, provider failures, or a failure to persist results do not consume the user's allowance. Provider usage cannot be undone.
- Default style: Funny. Context limit: 500 characters; location limit: 120. Each caption: 1–240 characters after trimming; three nonempty, nonduplicate outputs required.
- Accept JPEG, PNG, and WebP up to 5 MiB. Check actual file content as well as declared type; normalize orientation and strip metadata before sending the photo to the provider or publishing it. Bound decoding to 20 megapixels and resize the normalized image to at most 1600 pixels on its longest edge.
- Draft inputs may change. Changing the photo clears the active selection; existing captions remain historical records but cannot be published for a different photo. A caption always keeps the exact input snapshot that generated it. Changes to location/context/style do not rewrite older batches.
- At publication, use the selected batch's location/style/context snapshot so an old caption cannot silently acquire unrelated new context. Display photo, optional location, style, first name, selected caption, timestamp, and score; context stays private.
- Permit deleting own drafts as well as published posts. Deleting a post removes associated captions, generation records, and vote rows. Daily usage records survive deletion so deleting content cannot replenish allowance.
- Sort New by publication time descending, then ID. Sort Top this week by net score descending, then publication time descending, then ID. Seven days is a rolling 168-hour window, not a calendar week. Include zero and negative scores.
- Load 20 posts at a time with a Load more control. No realtime subscription is needed: update the acted-on score immediately and refresh scores when fetching the feed.
- Snapshot the creator's first name when publishing; subsequent profile changes do not rewrite previous posts. Expose neither last name nor avatar in this version.
- A complete existing profile remains required for creation/publication/voting, consistent with current onboarding.

## 4. Existing app and route changes

The repository uses Next.js App Router, React, Supabase SSR cookies, Google OAuth, and server actions. `lib/auth.ts` provides `requireUser` and `requireCompleteProfile`. Existing visit mutations already derive user IDs from the session. Keep those patterns.

| Route | Proposed behavior |
| --- | --- |
| `/` | Public caption feed; New/Top this week, voting, Create button. |
| `/create` | Protected creation page; create a saved draft after successful photo upload. |
| `/creations` | Protected My creations with drafts and published posts. |
| `/creations/[id]` | Protected owner-only draft editor, generation history, preview, publish/delete. This is not a public post/share page. |
| `/atlas` | Existing public community map moved from `/`. |
| `/members` | Existing protected personal travels page retained. |
| `/profile`, `/login`, `/auth/callback` | Existing account flows preserved. |

Navigation: Feed, Create, My creations, Travel atlas, Profile and Sign out when authenticated. Travel atlas provides access to the community map and My travels. Anonymous users see Feed, Travel atlas, and Sign in.

Anonymous vote/create interactions explain that sign-in is needed and lead to the existing login flow. For this version, completed-profile OAuth callbacks land on the feed instead of `/members`; incomplete profiles still go to `/profile`. Do not add an unrestricted return URL or change the required callback path. Users can resume saved drafts through My creations.

The existing community-map data and aggregate RPC stay intact. Move its page, adjust navigation and visit-action cache invalidation to include `/atlas`, and update tests for the route changes. Country visits do not become public individual histories.

## 5. User flows

### Create and generate

1. Authenticate and enforce existing profile completion.
2. Choose one photo; upload, validate, normalize, and save it under an owner-scoped path. Save a private draft with inputs. Do not show success before persistence succeeds.
3. Choose style and optionally supply location/context. Explain before generation that the photo and inputs are sent to Google, including the free-tier data-use implication.
4. Save inputs, then reserve a generation slot atomically. Show pending state and disable duplicate submission.
5. Send normalized photo plus exact system/user prompts to Gemini from the server.
6. Validate the result and persist the batch plus three candidates atomically. Show remaining allowance.
7. Select a candidate or generate three more. Previous batches stay available after refresh and across devices.

Do not consume an allowance unit merely for opening a draft, saving inputs, uploading a photo, choosing a candidate, or publishing.

### Publish

Preview the public card, including first-name attribution. On Publish, verify ownership, draft status, and that the selected candidate belongs to this draft and its current photo revision. In one transaction, snapshot public inputs/first name, set selected caption, and assign publication time. Repeating the same request is safe; changing selection after publication is denied by the database as well as the UI.

### Vote

The UI sends the desired final state: `1`, `-1`, or `null` to remove. It never supplies a voter identity. The server derives identity from the session.

- No existing vote: insert a row.
- Opposite vote: update the existing row.
- Click selected vote again: delete the row.
- Enforce published/nondeleted caption and reject creator self-votes.
- Return canonical current vote and aggregate score. If a request fails, restore the previous display and show a retry message.

Use idempotent final-state writes and a unique database constraint so repeated requests do not multiply votes. Serialize a user's pending interactions on a card to avoid out-of-order responses.

### Delete

Ask for confirmation naming the post/draft. Verify ownership, then make it unavailable and remove database content transactionally. Clean up its stored photo afterward. If Storage cleanup fails, retain an owner-scoped cleanup record and allow an explicit retry; do not resurrect the post or delete unrelated objects. No new background service is required. Existing signed image URLs may remain usable until their short expiry.

## 6. Data model

Use additive migrations. IDs are UUIDs, dates are `timestamptz`, and foreign keys/indexes support ownership and feed queries.

| Table | Principal fields and constraints |
| --- | --- |
| `moments` | `id`, `creator_id`, owner-scoped `photo_path`, `photo_revision`, draft `context`, `location`, `style`, `status`, nullable `selected_caption_id`, public input/name snapshots, `created_at`, `updated_at`, nullable `published_at`. Draft and publication states must be consistent. |
| `generation_runs` | `id`, `moment_id`, `creator_id`, unique request key, photo revision/path snapshot, context/location/style snapshots, exact system/user prompts, provider, exact model ID, prompt version, generation settings, timestamp. Only successfully validated results become user-visible batches. |
| `captions` | `id`, `generation_run_id`, `moment_id`, `creator_id`, ordinal 1–3, immutable generated text. Unique `(generation_run_id, ordinal)`. |
| `caption_votes` | `user_id`, `caption_id`, value checked to `-1` or `1`, timestamps; primary key `(user_id, caption_id)`. |
| `generation_requests` | Private operational reservation ledger: creator, request key, local quota date, moment, pending/succeeded/failed/expired state, lease expiry, result reference. Unique creator/request key; supports concurrency and idempotency. |
| `photo_cleanup_requests` | Private owner-scoped object cleanup record only when deletion cleanup needs retry. |

Ensure selected captions belong to the same moment with a composite foreign key or equivalently strong transactional database constraint. Enforce selected-caption immutability after publication. Generation runs/candidates cannot be replaced through direct browser writes. Index moments on publication time and votes on caption ID; index generation requests on creator/quota date/state.

Operational records must not cascade away when a moment is deleted: retain quota state/date and null any deleted content references. Cleanup records retain the exact owner/path independently of the deleted moment. Clear the selected-caption reference inside the deletion transaction before cascading captions to avoid circular foreign-key failures. Successful output records and their three candidates are committed as one batch; partial batches are never visible.

## 7. Authentication, RLS, and public reads

Enable and verify RLS for every application-owned table across the existing database, including legacy population tables discovered during the live audit. Inspect managed schemas without blindly modifying Supabase-owned system policies. Audit grants, exposed views/functions, and Storage policies as well as the RLS toggle.

| Data | Anonymous | Authenticated nonowner | Owner |
| --- | --- | --- | --- |
| Public feed projection and net scores | Read | Read | Read |
| Base moments/drafts | None | None | Read own; restricted draft edits |
| Runs, prompts, and candidate captions | None | None | Read own |
| Vote rows | None | Read/write own votes only | Same; no self-vote |
| Profiles and individual travel records | None | None | Existing own-row access |
| Country catalog and public map aggregate | Existing public read | Existing public read | Same |
| Generation operational ledger | None | None | Allowance/status through scoped server operations |

Public content is an explicitly limited feed projection, not `select *` access to the private base tables. Publish only selected caption text/ID, moment ID, normalized photo reference, optional location, style, first-name snapshot, publication time, and score. Do not join public callers into `profiles` or expose prompts, candidate lists, voter IDs, emails, or private context.

Use a fixed, audited aggregate/public-feed function with restricted execution grants and an empty/fixed search path if elevated reads are needed. It must filter to published records and project named fields. A normal view over owner-only RLS cannot expose other owners' posts; an elevated function therefore needs an explicit disclosure boundary. Public photo reads must likewise be restricted to the exact path of a published moment; own draft photos stay owner-readable. Use a private bucket and short-lived read URLs where needed; signed URLs are bearer links, not permanent revocable authorization.

Mutations normally use the existing session-bound Supabase client so RLS applies. DB policies/transactional functions independently enforce ownership, publication state, candidate membership, immutable published fields, and no self-voting. Protect immutable columns through grants and database enforcement, not UI hiding.

Trusted persistence of AI outputs and quota reservations may require a separate server-only Supabase service credential. If used, expose no generic administrative write endpoint: authenticate first, derive owner identity, validate fixed inputs, and call narrowly scoped transactional operations. Such a credential bypasses RLS, so explicit server/database checks are mandatory. Ordinary votes, profile edits, and travel actions must not use it. Never expose service or Gemini keys through `NEXT_PUBLIC_*`, HTML, logs, prompts, or commits.

Keep existing profile RLS private. First-name snapshots avoid widening profile reads to satisfy public attribution.

## 8. Gemini integration and allowance enforcement

Use a small server-only `generateCaptions` module. Provider/model are configuration, not browser inputs. Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in local ignored environment files and Vercel. Verify an available image-understanding model with free-tier access in the actual account; do not promise a specific quota or rely on a model name from a previous conversation remaining available.

One request asks for three text captions for the image and input snapshots. Request structured output and validate it independently. Funny is playful and humorous; Witty is concise and clever; Postcard is warm and descriptive. Do not invent destinations or details the photo/context cannot support. Treat user context as data, not instructions overriding system rules.

On regeneration, include prior captions for that photo as examples to avoid repeating; use a bounded history. Retain exact prompts and model/settings for every successful generation. Do not log photo bytes, signed URLs, keys, or private prompts to public logs. Provider safety refusals are a normal error state; do not bypass them with another provider.

Reserve quota in a database transaction locking the user's quota scope. Count succeeded batches plus active reservations for the local date; reject the sixth. Permit at most one in-flight generation per user. Bind request keys to owner, draft, photo revision, and input snapshot. A duplicate request returns its status/result without issuing a second provider call.

Use a 45-second provider timeout and a two-minute reservation lease. Release failed reservations; expired leases are reclaimed transactionally on a subsequent request, requiring no scheduler. Do not automatically reissue an ambiguous provider request under the same key. Commit a returned batch only if its reservation is still valid; late results cannot exceed the limit or attach to an altered photo. Atomically mark success when saving three captions. Retain allowance usage independent of deleted posts.

Account-wide provider exhaustion can occur even when a user has allowance left. Show a distinct temporary provider-limit message and retain the draft. Stay on free-tier configuration; no automatic billing upgrade or paid fallback. Verify hosting execution limits support the timeout before deployment.

## 9. Components and implementation boundaries

Proposed modules follow current repository conventions; exact filenames may be refined in the implementation plan.

- Feed page/components: cards, net-score vote control, sorting, pagination, sign-in affordances, pending/error states.
- Draft page/components: normalized photo upload, persistent input form, style choice, candidate batches, allowance display, selection and public preview.
- `lib/captions.ts`: scoped read models and creation/publication helpers; avoid mixing private and public projections.
- `lib/ai/gemini.ts`: provider call, prompt construction, structured response validation; server-only.
- Authenticated server mutations: draft saves, generation, publication, deletion, desired-state votes.
- Database migrations/functions: constraints, grants/RLS, publication transaction, quota reservation/finalization, aggregate projections.
- Existing navigation/map/auth changes: move community page to `/atlas`, preserve `/members`, adjust callback landing and revalidation.

For upload, avoid pushing a 5 MiB image through a default-size server action. Use an authenticated bounded upload route or a narrowly authorized direct Storage upload, with validation/normalization before the image becomes publishable. Read the installed Next.js guides before implementation and configure request/runtime limits intentionally.

## 10. Error states and accessibility

- Invalid photo or text: field-specific error; preserve valid inputs.
- Upload/persistence failure: recoverable message; remove only the failed task's orphan upload when safe.
- Missing provider configuration: generation unavailable; browsing/voting still work; never show fake generated results.
- Quota reached: remaining allowance and reset time; existing candidates remain selectable/publishable.
- Provider block/timeout/quota: distinct understandable messages; saved draft/history remain.
- Ownership violation/deleted post: deny the operation; refresh stale UI without exposing another user's draft existence.
- Failed vote/delete: restore the prior state and offer retry.
- Empty feed: clear creation invitation. Seed content, if desired for feedback, must come from real generation with stored prompts, never fabricated votes or travel history.

All controls work by keyboard; votes have accessible names and pressed states. Pending and error messages are announced. Provide meaningful photo alternative text or editable owner-supplied descriptive text if needed for accessibility; it must not replace or modify the generated caption. Mobile layouts have no horizontal overflow and preserve readable captions/tap targets.

## 11. Acceptance and verification

| Requirement | Evidence required |
| --- | --- |
| Real AI creation | Signed-in user generates exactly three valid candidates; database stores exact prompts/model and outputs. |
| Regeneration | Additional batch persists; previous choices survive refresh; sixth successful daily batch is denied. |
| Draft persistence | Leave/reopen a draft and recover photo, inputs, history, and selection. |
| One immutable publication | Publish selected saved candidate; direct attempts to substitute edited text or another draft's caption fail. |
| First vote is an insert | Show one persisted row for correct authenticated user and caption; refresh retains vote/score. |
| Vote switching/removal | Opposite vote updates same row; removing deletes it; retries do not duplicate rows. |
| Authentication | Anonymous generation/votes fail even through direct calls; login and profile onboarding still work. |
| Isolation | Two real test identities cannot read/change each other's drafts, prompts, votes, profiles, or travel rows. |
| Public privacy | Anonymous feed exposes only published projection and aggregates; unpublished photos/prompts are inaccessible. |
| Attribution | Only first name appears; private profile policies are not widened. |
| Delete | Own published post disappears; other user's delete fails; associated content/votes removed and exact photo cleanup verified. |
| Concurrent quota | Parallel generation and repeated request keys cannot exceed five successes or duplicate provider calls. |
| Feed | New default, deterministic Top this week net-score sorting, working pagination and negative scores. |
| Existing app | Community atlas, personal visit edits, profile/photo edits, Google sign-in preserved. |
| Public deployment | Exact final deployment URL browses in Incognito; login works on its configured callback; protection disabled. |

Use meaningful unit/action tests for prompt/output validation, authorization, desired-state voting, quota races/idempotency, and publication invariants. Add database authorization tests under anonymous/two-user roles, using rollback transactions or designated test records. Run lint, tests, and production build. Conduct interactive desktop/mobile QA through the built-in Browser. Do not insert false visits, votes, or content into real user accounts to simulate verification.

PM session: ask the PM to create, regenerate, publish, and vote without coaching. Record observed confusion, their suggestions, decisions about each suggestion, and resulting changes. Revalidate affected flows and retain evidence for the assignment.

## 12. Delivery sequence and prerequisites

1. User reviews this spec; then produce a concrete implementation plan before product code changes.
2. Verify available Gemini account/model/quota and server credentials without recording secrets in documents.
3. Audit live schema; add migration and permission/constraint tests.
4. Deliver one complete creation → saved generation → selected publication → persistent vote flow.
5. Add regeneration/persistent draft management, feed sorts, navigation, deletion and cleanup.
6. Run security/concurrency checks and browser QA; gather PM feedback and iterate.
7. Review repository changes, commit only intended task files under repository policy, deploy after release authorization, and verify the exact deployment URL and OAuth callback. Record final commit/deployment and submit its commit-specific URL.

Database prerequisite: repository instructions require local MCP server `supabase-coms6998`, project `swmgfanscadzfkqoctle`. That server is not exposed in this session. Live database audit/migrations require a session with it; do not substitute a generic connector. This spec is based on repository source and historical SQL, not a verified inventory of the live database.

Workflow prerequisite: the trusted bootstrap helper was run with `--check ... --apply` on 2026-10-08. It refused an existing `.engineering` folder without its installer manifest. `.engineering/TEAM.md` and `.engineering/SESSION.md` were absent. Preserve that folder; do not retry or overwrite it automatically. Resolve workflow installation separately if needed; the conflict does not block this document.

No product dependencies, code, database tables, provider configuration, or deployment settings were changed while preparing this spec. No background service was started.

## 13. Reference material

- Assignment requirements supplied in this conversation: authenticated creation/votes, saved AI media and prompts, strict RLS, persona-driven feature choices, PM iteration, unprotected Vercel deployment, commit-specific submission URL.
- Current repository: `app/page.tsx`, `app/members/page.tsx`, `app/members/actions.ts`, `app/auth/callback/route.ts`, `app/profile/actions.ts`, `lib/auth.ts`, `lib/travel.ts`, and `lib/supabase/server.ts`.
- Historical setup/evidence: `outputs/assignment-3/database-setup.sql`, `travel-setup.sql`, `travel-security-check.sql`, and `TRAVEL-LIVE-VERIFICATION.md`.
- [Gemini pricing and free-tier data use](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini project rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel generated deployment URLs](https://vercel.com/docs/deployments/generated-urls)

## 14. Spec review result

Self-review completed for scope coverage, ambiguous publication rules, privacy boundaries, concurrent quota handling, deletion/usage interaction, saved prompt provenance, and assignment acceptance evidence. Proposed engineering defaults are separated from user-accepted product decisions. No unresolved product placeholder remains; provider account availability, live schema audit, and workflow installation are explicit prerequisites rather than assumed completed work.
