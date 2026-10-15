// Disposable PostgreSQL-compatible test database. Does not contact production.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
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
 for (const path of ["supabase/migrations/202610080001_caption_community.sql", "supabase/migrations/20261008165700_post_locations.sql", "supabase/migrations/20261015080000_brainrot.sql", "supabase/migrations/20261015081000_brainrot_replacement_styles.sql", "supabase/migrations/20261015083000_brainrot_revision_guard.sql", "supabase/migrations/20261015084000_brainrot_revision_error.sql", "supabase/migrations/20261015133000_unlimited_image_first_generation.sql"]) await db.exec(await readFile(path, "utf8"));
 await db.exec(await readFile("tests/brainrot-database.sql", "utf8"));
 await db.exec(await readFile("tests/brainrot-generation-unlimited.sql", "utf8"));
 await db.exec(`insert into public.moments(id,creator_id,photo_path,context,location,style) values('10000000-0000-4000-8000-000000000080','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/legacy.jpg','','Retired place','Funny');
 insert into public.generation_runs(moment_id,creator_id,photo_revision,photo_path,request_key,context,location,style,system_prompt,user_prompt,model,settings)
 select id,creator_id,photo_revision,photo_path,gen_random_uuid(),'','Retired place','Funny','legacy test prompt','{"location":"Retired place","context":"","style":"Funny"}','test','{}' from public.moments where id='10000000-0000-4000-8000-000000000080';`);
 await db.exec(await readFile("supabase/migrations/20261015150000_retire_maps_and_claim_usernames.sql", "utf8"));
 await db.exec(await readFile("tests/brainrot-current.sql", "utf8"));
 await db.exec(await readFile("tests/brainrot-generation-unlimited-current.sql", "utf8"));
 const rows = await db.query("select count(*)::int as n from pg_tables where schemaname='public' and not rowsecurity");
 assert.equal(rows.rows[0].n, 0);
 console.log("PASS Brainrot isolated migration, public projection, profile ownership, immutable publication, unvoted feed, vote uniqueness and private history assertions.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await db.close(); }
