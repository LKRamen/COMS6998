# Assignment 4 completion audit

Implementation and hosted API integration are verified. The assignment is not yet ready to submit.

| Requirement | Current authoritative evidence | Remaining acceptance work |
| --- | --- | --- |
| Logged-in users create AI captions | Real hosted Auth sessions; actual upload route normalizes/stores photo; actual Gemini batch saved | Browser upload/editor flow |
| Three choices and regeneration | Two actual saved three-caption Gemini batches and reload check | Browser choice/regeneration interaction |
| Publish one selected caption | Hosted authenticated publication, selected text matches guest projection | Browser publication preview/submit |
| Votes insert associated user/caption rows | Hosted two-user RPC, persistent score and concurrent one-row assertion | Browser vote interaction with live data |
| Immediate net score | Component/browser fixture checks and hosted desired-state response | Combined browser + hosted vote success/failure |
| Save prompts and generated media | Hosted exact prompt/photo/request provenance assertions | Browser private history inspection |
| Strict RLS on all application tables | All ten public tables RLS-enabled; policy/grant audit and hosted role/Storage denials | Managed internal schemas remain managed by Supabase |
| Five successful batches/day | Hosted quota/failure/deletion assertions, Eastern reset in SQL | Confirm reset after a real day boundary when practical |
| Preserve existing maps | Existing real atlas observed; original visits/profile counts preserved | Final deployment regression |
| Reliable error behavior | Provider 503 recovery, stale/expired SQL tests, actual guest/cross-origin upload denial | Browser failure paths and remaining hosted replacement/deletion races |
| Thoughtful travel product loop | Approved spec, implemented feed/drafts/captions/voting | PM feedback and iteration |
| Public incognito deployment | Local production build passed | Vercel environment/release, disable protection, verify commit-specific URL |

Evidence: `HOSTED-API-VERIFICATION.json`, `UPLOAD-ROUTE-VERIFICATION.json`, and `VERIFICATION.md`. No original user rows/photos were modified by synthetic API checks; task-created accounts and artifacts were removed. Both hosted SQL suites rolled back.
