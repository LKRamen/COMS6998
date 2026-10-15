// Disposable PostgreSQL-compatible test database. Does not contact production.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PGlite } from "../work/sql-check/node_modules/@electric-sql/pglite/dist/index.js";
const db = new PGlite();
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;
 create table auth.users(id uuid primary key);
 create table public.profiles(id uuid primary key references auth.users(id), first_name text,last_name text,avatar_path text,created_at timestamptz default now());
 alter table public.profiles enable row level security;
 grant select,update on public.profiles to authenticated;
 create policy profiles_read_own on public.profiles for select to authenticated using(id=auth.uid());
 create policy profiles_update_own on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),name text,bucket_id text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated;
 grant select on storage.objects to anon,authenticated;
 create table public.travel_countries(code text primary key,name text);
 create table public.country_visits(user_id uuid references public.profiles(id),country_code text references public.travel_countries(code));
 alter table public.travel_countries enable row level security;
 alter table public.country_visits enable row level security;
 grant select,insert,delete on public.country_visits to authenticated;
 insert into auth.users values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
 insert into public.profiles(id,first_name,last_name) select id,'Test','Creator' from auth.users;`);
 for (const path of ["supabase/migrations/202610080001_caption_community.sql", "supabase/migrations/20261008165700_post_locations.sql", "supabase/migrations/20261015080000_brainrot.sql"]) await db.exec(await readFile(path, "utf8"));
 await db.exec(await readFile("tests/brainrot-database.sql", "utf8"));
 const rows = await db.query("select count(*)::int as n from pg_tables where schemaname='public' and not rowsecurity");
 assert.equal(rows.rows[0].n, 0);
 console.log("PASS Brainrot isolated migration, public projection, profile ownership, immutable publication, unvoted feed, vote uniqueness and private history assertions.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await db.close(); }
