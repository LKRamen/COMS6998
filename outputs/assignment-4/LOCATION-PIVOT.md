# Post location implementation

Authorized by the user on 2026-10-08: implement and deploy these changes.

- Keep personal and community maps; derive them solely from published posts.
- Search specific places, cities, or countries. Store a selected label and the existing numeric country code. Require that selection at publication, not generation or draft save.
- Authors may correct locations after publication. Photo, selected caption, votes, and historical generation prompts stay fixed.
- Personal map marks countries with the author's posts. Community shading counts published posts per country. Country links filter corresponding posts. Deleting the last post removes that country.
- Remove manual travel editing from the product; preserve the legacy table, but revoke its mutation permissions. Previously authorized dummy data reset is complete.

Implementation defaults: Photon/OpenStreetMap place search through a fixed server endpoint, explicit searches and cached responses, 8-second timeout, no API key or GPS collection; country selection remains available without the provider. Provider is a public demonstration service with usage limits, so keep an adapter and a country fallback. Store no precise coordinates. Sources: https://github.com/komoot/photon and https://github.com/komoot/photon/blob/master/docs/api-v1.md. Alpha-2 to numeric mapping derived from the v10.0 country dataset at https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes (CC BY-SA 4.0), filtered to this app's 235-country catalog.

Plan: (1) validate search and selection, (2) add database country field, owner-only mutations, publication guard and post-derived aggregates/filtering, (3) integrate upload/editor/maps, (4) run unit/database/build and browser checks, (5) commit scoped changes and deploy production to the existing project.

Engineering bootstrap reported an existing folder without its installation manifest. TEAM.md and SESSION.md are absent; no existing engineering files were overwritten.

Verification and deployment results will be recorded below.

Verification: 72 unit/component tests passed in 21 files; lint and production build/typecheck passed. Isolated database regression suites and adapted live rollback assertions passed, including owner/guest restrictions, location correction preserving votes/prompts, two posts in one country, deletion of one versus the last post, and denied legacy manual mutations. Live migration applied through supabase-coms6998. Actual local Next upload/replacement with hosted Auth/Storage persisted United States then Japan country selections and cleaned up all disposable data. Live Central Park search returned country 840. Browser inspection covered desktop/mobile atlas and mobile location results; an overlapping help-text style was corrected. User requested to take over remaining interactive QA.

Deployment: production READY, source commit 4a2acd03ac5edd564e72b9453150874f6e7fa45a, deployment dpl_FZtjEYGsFJRZ6eRgCVpBVozvd4B7. Live https://coms-6998-theta.vercel.app; immutable https://coms-6998-3o8kbf2fi-lkr2124-2742s-projects.vercel.app. Cookie-free home/atlas/country-filter checks and actual Central Park search passed on both URLs; guest create redirects to app login. Temporary Next/Vite sessions58922/41387 stopped and both listening ports verified closed. Remaining hands-on acceptance is assigned to the user at their request.
