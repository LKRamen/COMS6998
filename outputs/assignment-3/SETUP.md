# Assignment 3: account and profile setup

## Prepared app

The existing population ranking at `/` stays public. `/login` starts Google OAuth
with an application redirect URL of exactly `<current-origin>/auth/callback`.
The callback exchanges the authorization code for a cookie session. Users missing
either name go to `/profile`; completed profiles go to `/members`.
Both protected pages and the profile save action validate the user with Supabase
Auth. Profile photos use a private Storage bucket and expiring signed URLs.
Replacing a photo removes the previous file after saving its new path.

Existing `supabase_project_url` and `supabase_anon_key` variables are supported.
Alternatively use `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use a service-role key for either key
variable. No Google client secret belongs in app code or Git.

## Remaining database setup

This session did not expose the required `supabase-coms6998` MCP server.
Use a Codex session with that local server, scoped to `swmgfanscadzfkqoctle`.
Inspect existing tables, triggers, buckets, and policies before applying
`database-setup.sql`; it is a reviewed setup draft, not an applied migration.
Adapt it to any preexisting objects rather than dropping them. Record the final
SQL as a migration and run the project advisors.

The SQL creates nullable first/last name fields, an `auth.users` insert trigger,
backfills existing users, and enables owner-only read/update policies. Storage
policies allow reading, uploading, and removing only the current user's files.
The app generates unique paths rather than overwriting storage objects.

## Google OAuth

1. In Google Cloud Console, select your own Google project and configure its
   OAuth consent screen. Create an OAuth client of type **Web application**.
2. Register `https://swmgfanscadzfkqoctle.supabase.co/auth/v1/callback` as the
   Google client's authorized redirect URI. This is Google's callback to
   Supabase, distinct from the app's `/auth/callback` route.
3. In the existing Supabase project, enable the Google Auth provider and enter
   your Google client ID and secret. If the consent screen is in testing mode,
   add the accounts that need to sign in as test users.
4. In Supabase Auth URL Configuration, set the production Site URL and allow
   `http://localhost:3000/auth/callback`, the production origin's
   `/auth/callback`, and the exact commit deployment's `/auth/callback`.
   Do not add a `next` parameter or another application destination.

Reference: [Supabase Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
and [SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

## Deployment and submission

Keep the existing GitHub repository, Supabase project, and Vercel project.
Set the Supabase environment variables for Production and Preview in Vercel.
After reviewing and committing the app, deploy that commit through the existing
project. Turn off Vercel deployment protection for the assignment and verify the
immutable deployment URL in Incognito. Submit that commit-specific URL, not just
the moving production alias. This session did not change cloud settings or deploy.

## Live acceptance checks

- Signed out: `/` works; `/members` and `/profile` redirect to `/login`.
- New Google signup: one `profiles` row appears automatically; both names start
  nullable; the user is prompted to complete them.
- Blank/whitespace names cannot unlock the members area.
- Save both names; the members route becomes accessible.
- Edit both names and upload a JPEG, PNG, or WebP up to 2 MB; reload and confirm
  the changes persist. Unsupported formats and larger files are rejected.
- Replace the image and confirm the new image renders.
- Sign out and try protected URLs directly in Incognito.
- With a second user, verify that profiles and photos cannot be read or modified
  across accounts through the Supabase API.
- Verify that the submitted deployment allows Google sign-in from its own origin.
