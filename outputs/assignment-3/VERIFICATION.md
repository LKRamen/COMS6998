# Local verification — 2026-10-01

- `npm test`: 14 tests passed across 4 files.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js 16.3.8, including TypeScript checks.
- Package installation audit: zero reported vulnerabilities after upgrading
  Next.js and eslint-config-next from 16.3.5 to 16.3.8.
- Public ranking supports both existing lowercase and standard Supabase
  environment-variable names; a regression test covers the standard names.
- Auth tests cover missing users, incomplete names, and completed profiles.
- OAuth tests confirm the exact `/auth/callback` URL on the current deployment.
- Profile tests cover owner-scoped updates, blank names, unsupported/oversized
  photos, upload failure, and cleanup following a failed profile update.

## Blocked verification and release

The local `supabase-coms6998` server is unavailable in this session. No generic
connector was substituted, no SQL was applied, and live Auth/Storage behavior
remains unverified. Google credentials were not created or configured.

Browser QA was retried after renewed user approval. The Browser tool rejected
`http://localhost:3103` because a saved user permission preference blocks it.
No alternate browser surface or browser automation workaround was used.
Desktop/mobile visuals remain unverified. The temporary production QA server was
stopped after the rejection.

Cloud setup and deployment are pending; this is not yet a submission-ready live
deployment. Follow SETUP.md in a session exposing the required scoped MCP server.
