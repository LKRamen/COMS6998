# Assignment 4 completion audit

Local implementation is prepared; the assignment is not yet ready to submit.

| Requirement | Evidence | Remaining acceptance work |
| --- | --- | --- |
| Logged-in users create AI captions | Protected creation actions, validated photo upload, real provider smoke | Save and reload a real hosted generation |
| Three choices and regeneration | Component/action tests, current-photo history filtering | Exercise real saved batches and five-success limit |
| Publish one selected caption | Atomic immutable publication and private selection tests | Publish using an authenticated account |
| Votes insert associated user/caption rows | Rollback SQL and session-bound desired-state vote tests | Two real users, refresh persistence, self-vote denial |
| Immediate net score | Component tests and browser fixture interaction | Hosted vote success/failure and score refresh |
| Save prompts and generated media | Private generation rows include prompts, model/settings, photo path and request key | Inspect hosted persistence and owner isolation |
| Strict RLS on all tables | New-table grants/policies and isolated role assertions | Audit existing exposed tables and actual hosted policies |
| Thoughtful travel product loop | Approved scope, new/top feed, private drafts, retained atlas | PM feedback and iteration |
| Reliable error behavior | Invalid provider response, timeout, mutation and pagination recovery tests | Real network/provider/database failure checks |
| Public incognito deployment | Local production build passed | Release, disable protection, verify commit-specific URL |

The immediate blockers are the current Codex process missing the newly configured MCP token and the app missing its private Supabase service key. The token is configured for future sessions; its acceptance has not been verified. See `SETUP.md`.
