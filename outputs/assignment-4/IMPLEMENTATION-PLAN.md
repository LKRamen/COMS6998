# Been there Implementation Plan

> For agentic workers: use superpowers:executing-plans for sequential implementation and a final independent review. Track progress in `IMPLEMENTATION-LOG.md`.

**Goal:** Implement the approved photo → three captions → regenerate → publish one → persistent vote loop.

**Architecture:** Session-bound Supabase clients enforce user-facing permissions; tightly scoped server-only operations persist verified AI batches. SQL transactions implement quota, publication and voting. Next.js pages keep public feed data separate from private drafts.

**Tech Stack:** Installed Next.js/React, Supabase SSR, Gemini REST, Sharp, Vitest.

**Spec:** [IMPLEMENTATION-SPEC.md](./IMPLEMENTATION-SPEC.md), approved by user 2026-10-08 with authorization to begin implementation.

## Global constraints

- Three candidates, five successful batches/day in America/New_York; one in-flight request/user.
- Five MiB JPEG/PNG/WebP, 20MP decode cap, normalized JPEG longest edge 1600px.
- Context 500 characters, location 120, captions 240; Funny/Witty/Postcard.
- Owner-only drafts/prompts/history; public selected caption and first-name snapshot.
- One desired-state vote/user/caption; no self-votes. Published content immutable.
- Preserve travel records, profiles and existing files. Use only supabase-coms6998 for live database changes.
- No live deployment without release authorization; missing infrastructure is reported, never simulated as working.

## Review focus

1. Concurrent requests and late provider results must not create extra batches.
2. Old-caption selection must never attach to a changed photo or input snapshot.
3. Public feed and image access must not disclose unpublished records.
4. Failed deletion cleanup must preserve quota and permit exact-path retry.
5. Missing provider/database setup must show a recoverable state rather than fabricated data.

## Task 1 — database contract

Files: `supabase/migrations/202610080001_caption_community.sql`, `outputs/assignment-4/database-verification.sql`.

Interfaces: public RPCs `caption_feed(p_sort,p_offset)`, `caption_vote(p_caption_id,p_value)`, `caption_publish(p_moment_id,p_caption_id)`, `caption_delete(p_moment_id)`, `caption_allowance()`. Server-only RPCs `caption_reserve(p_user_id,p_moment_id,p_request_key,p_system_prompt,p_user_prompt,p_model,p_settings)`, `caption_finish(p_user_id,p_request_id,p_captions)`, `caption_fail(p_user_id,p_request_id)`.

- [x] Write rollback authorization/assertion tests: guest denied writes; user B cannot read user A's draft; self-vote denied; duplicate vote retains one row; six batches denied; deletion does not erase usage.
- [x] Implement tables, grants/RLS, immutable fields, owner Storage, public projection, locked quota transactions and cleanup ledger.
- [x] Parse/verify SQL locally.
- [ ] Apply and run adapted rollback tests against the hosted project when scoped MCP is available.

## Task 2 — provider, validation and data services

Files: `lib/caption-input.ts`, `lib/ai/gemini.ts`, `lib/captions.ts`, `lib/supabase/admin.ts`, `lib/caption-photo.ts`; corresponding test files.

Interfaces: `parseInputs(value): CaptionInputs`, `validateCaptions(value): string[]`, `generateCaptions({image,systemPrompt,userPrompt}): Promise<string[]>`, `normalizePhoto(file): Promise<Buffer>`, typed `FeedPost`, `Moment`, `CaptionRun`, `getFeed`, `getMoment`, `getCreations`.

- [x] Write tests rejecting invalid/duplicate captions, overlong context, unsupported/mislabeled photos; test real image normalization/metadata removal.
- [x] Observe failures; implement strict validation, prompts and bounded REST provider call.
- [x] Add server-only data projections and privileged client restricted to generation result operations.
- [x] Test provider blocks/429/timeouts and generation reservation failure/success/finalization through mocked external boundaries.

## Task 3 — mutations

Files: `app/api/caption-photo/route.ts`, `app/creations/actions.ts`, `app/components/vote-control.tsx` and tests.

- [x] Test session-derived identities and no call after failed auth; cross-origin upload denial; publish receives candidate ID, never browser caption text.
- [x] Implement bounded normalized upload; compensation on failed draft persistence.
- [x] Implement saved inputs/selection, atomic generation reserve/finish/fail, publish/delete and cleanup retry; use session client for votes.
- [x] Test idempotent desired-state votes and failure recovery; run focused tests.

## Task 4 — user interface and atlas

Files: `app/page.tsx`, `app/create/page.tsx`, `app/creations/page.tsx`, `app/creations/[id]/page.tsx`, `app/components/caption-draft.tsx`, `app/components/caption-feed.tsx`, `app/atlas/page.tsx`, `app/components/travel-nav.tsx`, `app/globals.css`, existing auth/map tests.

- [x] Update public page tests to require feed loading/empty/error states, protected destinations and atlas link.
- [x] Implement cards, pagination/sorts, persisted drafts/batches, select/generate/publish preview and delete confirmation.
- [x] Move existing community page to atlas; retain personal route; update callback landing/cache invalidation.
- [x] Validate desktop/mobile layout, keyboard controls and no misleading success when setup is absent.

## Task 5 — verification and handoff

Files: `.env.example`, `outputs/assignment-4/SETUP.md`, `VERIFICATION.md`, `IMPLEMENTATION-LOG.md`.

- [x] Run tests, lint, type checking and build; fix failures once with regression tests.
- [x] Register temporary dev server with maintenance registry; inspect using built-in Browser; stop only task-owned service at completion.
- [x] Independent final code review; resolve important findings and rerun affected checks.
- [x] Record unavailable live checks precisely. Commit only task files; preserve preexisting untracked files. No push/deployment in this stage.

## Execution choice

Implement sequentially in this session under the user's explicit instruction to begin. Infrastructure questions remain pending; local implementation and review continue independently. A real provider smoke check passed. Live migration and application integration remain incomplete until the scoped server and private application service key are available.
