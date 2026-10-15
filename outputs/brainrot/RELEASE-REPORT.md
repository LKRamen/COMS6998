# Brainrot release report

Brainrot is deployed to the existing Vercel project and retains the existing Supabase database, Google authentication, Gemini integration, repository and historical content.

- **Commit-specific deployment:** https://coms-6998-8vwsu6nw8-lkr2124-2742s-projects.vercel.app
- **Stable production:** https://coms-6998-theta.vercel.app
- **Deployed source commit:** `fd82b38ebb106f5e35e739c0ed331b43b0626ce0`
- **Branch:** `codex/brainrot-overhaul`
- **Deployment:** `dpl_6gJJP3fwmpAM8PSct8US8ScERcRF`, production Ready; guest access verified without Vercel sign-in.

## Capabilities

The near-black/coral responsive interface includes a public landing preview; a spring-based swipe feed with mouse/touch, arrow keys and accessible vote buttons; authenticated creation with drag-and-drop/picker preview, seven humor styles, context, three real Gemini captions, regeneration and editing; persistent drafts with serialized autosave and tab recovery; flattened shareable publication; trending/new/top searchable Explore; public creator profiles; profile settings and opt-in avatars; persistent meme detail URLs and sharing; own-content deletion and private generation history. Existing travel atlas and historical creations remain available.

Votes use optimistic animation, write guards and visible rollback/retry. The feed excludes previously voted posts and self-created content, prefetches a bounded queue and offers Create/Explore when caught up. Generation and upload failures preserve usable drafts. Publication is idempotent and stores source image and text separately from the rendered JPEG.

## Data and security

Four versioned, applied migrations evolve the existing schema rather than duplicate it: public creator identity/discovery and caption/render metadata, replacement-photo styles, atomic stale-photo autosave protection, and a nonretryable stale-revision error. Existing moments/captions/generation_runs/caption_votes remain the persistence model. The existing `(user_id, caption_id)` primary key guarantees one active vote per published selected caption.

RLS is enabled on all ten public application tables. Explicit public projections expose published content and intended creator fields while keeping drafts, exact generation prompts, email and private avatar references private. Fixed-search-path functions enforce ownership; normal authenticated clients perform votes and private reads. Service credentials remain server-side for authorized media/generation operations. Storage paths are owner-scoped and public avatar sharing is opt-in.

Real distinct-account tests denied anonymous/impersonated/self/nonexistent votes, unauthorized profile/content mutation, private generation access, and another user's Storage writes. Stale source-photo saves fail atomically. Production upload rejects missing authentication and cross-origin requests.

## Verification evidence

- Baseline: 72 tests passed. Final: **90 tests across 27 files passed**, plus the isolated PostgreSQL-compatible database/migration/security suite.
- Final lint, TypeScript/optimized local build and Vercel production build passed.
- Real local Browser flows exercised onboarding/profile persistence, source upload, two Gemini batches, selected/edited caption reload, publication, short-drag spring-back, actual right-swipe and left-arrow voting, refresh exclusion, gallery vote removal and profile aggregate reconciliation.
- Real **Vercel runtime** test exercised authenticated upload, actual Gemini generation, three persisted captions with exact private prompts, Linux Sharp flattening, public image/detail, repeated-publication idempotence, guest vote rejection and a distinct user's persistent vote/aggregate/feed exclusion.
- Deployed guest Browser checked desktop and 390×844 mobile feed, gallery/detail navigation and sign-in messaging. All public gallery images loaded; no horizontal overflow. Screenshots are alongside this report.
- Fresh code review found and verified fixes for Unicode caption clipping, @handle search and stale-photo autosave races; no remaining Important issues in its final focused review.
- Production dependencies: zero audit vulnerabilities. Full audit retains five **development-only lint dependency** findings; a forced incompatible framework downgrade was deliberately avoided.

Reports: `HOSTED-SECURITY.json`, `HOSTED-VOTES.json`, `PRODUCTION-VERIFICATION.json`, `QA-CLEANUP.json`.

## Preservation, limits and handoff

Both temporary QA accounts and all four of their photo assets were removed. Zero fixture profiles/assets remain. All five historical moments match the saved content fingerprint; four historical published posts and two historical votes remain. Task preview services were stopped and maintenance records updated. No new paid service or replacement project was created, and no secrets were printed or committed.

No blocking external approval remains. A fresh personal Google consent/signup was not automated; the existing provider configuration is preserved and real Supabase sessions/onboarding were tested. Avatar policies and persistence were tested through real authenticated APIs; the browser avatar file-picker path was not separately exercised. Failure recovery has focused component tests; not every network failure was reproduced in the deployed browser. The engineering bootstrap refused an existing installation without its manifest; it was preserved and did not prevent release.

The public feed currently has four real historical published memes. Empty states and creation paths handle that small inventory; no fake accounts or engagement were added. Optional comments, bookmarks, leaderboards and gamification were intentionally omitted. Further traffic is subject to the existing Gemini quota and provider availability.

The product code is committed locally on the named branch and deployed from the exact archived commit. No GitHub push or pull request was required for this deployment. Unrelated pre-existing untracked instructions and assignment screenshots were left untouched. `PROGRESS.md` in the repository contains the implementation decisions and verification history.
