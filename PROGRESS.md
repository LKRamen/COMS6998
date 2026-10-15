# Brainrot overhaul progress

## Scope and authorization
User supplied the full Brainrot mission on 2026-10-15 and explicitly requested autonomous implementation, meaningful commits, real-infrastructure verification and deployment to the existing Vercel project. User requested quiet work until a report around 09:00 America/New_York. No replacement infrastructure, paid commitments, historical-data deletion or relaxed authentication is authorized.

## Current phase
Phase 1 audit complete; beginning additive data/authentication changes.

## Audit
- Existing repository: C:/Users/lkrah/COMS6998; origin LKRamen/COMS6998. Baseline HEAD 57f51a7. Existing unrelated untracked AGENTS.md and assignment-3 evidence are preserved.
- Next.js 16.3.8 App Router, React 19.3, strict TypeScript, CSS, Supabase SSR, Sharp. Vitest, ESLint and build scripts available. Installed Next.js server/client guide read.
- Existing Google OAuth, private profiles/avatars, image normalization, private caption-photo bucket, three-candidate Gemini structured generation, exact prompt/settings persistence, five-successful-batches/day quota, idempotent transactional votes/publication, travel atlas.
- Live scoped Supabase project swmgfanscadzfkqoctle: all ten public tables have RLS enabled. Four published posts, five moments, two votes and two profiles observed before changes. No data reset.
- Existing schema models memes through moments + selected captions, generations through generation_runs, votes through caption_votes with primary key(user_id,caption_id). Preserve these names and immutable selected-caption relationship rather than duplicate the schema.
- Existing Vercel project coms-6998, team lkr2124-2742s-projects. Connector lacks team access; investigating existing CLI credentials. Local environment inspected by variable name only; secret values must never be printed.
- Engineering bootstrap refused existing .engineering directory without installer manifest. TEAM.md/SESSION.md absent. Preserved; no retry/overwrite.

## Plan and architectural decisions
1. Extend existing profiles with unique lowercase usernames, display names and bios; expose only a safe public projection. Keep legacy first/last names and private generation fields private. Public avatar sharing uses an explicit separate opt-in storage reference.
2. Extend existing styles and add optional caption edit/render metadata. Remove the old mandatory travel-location publication constraint for the new meme product. Keep travel data and atlas routes. Add bounded discovery RPCs for unvoted swipe feed, search/sorts/detail/profile; derive aggregates from votes.
3. Build dark/coral shared navigation and responsive system, landing, Motion-powered swipe deck, gallery, detail/share and public/editable profiles. Reuse verified vote RPC and session clients.
4. Upgrade upload with local preview/drop, preserve drafts, reuse Gemini with versioned Brainrot prompts. Render a shareable flattened image server-side with Sharp before transactional publication; compensate failed uploads without touching historical assets.
5. Test swipe success/failure/rapid input, filtering, profile validation, rendering, publication and security using isolated and real role-bound clients. Run full suite/lint/type/build, desktop/mobile Browser inspection and deployed HTTP checks.
6. Commit only intended files, deploy an archive of the exact commit to existing Vercel project, verify guest access and runtime behavior. Record exact URL/SHA and limitations.

Ruling: user explicitly says create a short plan and proceed immediately; this supersedes skill review pauses. Execute inline, with a fresh final review when useful.

## Tests run
- Baseline Vitest running; results pending.
- Read-only live RLS/policy/function grant inventory completed.

## Known issues / blockers
- Historical assistant response was inaccessible; resolved when user pasted the complete mission.
- Vercel connector 403 for existing team; CLI fallback pending.
- Engineering bootstrap conflict as described above; does not block app work.

## Next steps
Add and test migration, then build core product and verify real flows. Update this ledger at milestones.
