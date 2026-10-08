// Isolated PostgreSQL-compatible verification. Never contacts the live project.
import { readFile } from "node:fs/promises";
import { PGlite } from "../work/sql-check/node_modules/@electric-sql/pglite/dist/index.js";
const db = new PGlite();
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;
 create table public.profiles(id uuid primary key,first_name text,last_name text);
 alter table public.profiles enable row level security;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,name text,bucket_id text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated;
 grant select on storage.objects to anon,authenticated;
 insert into public.profiles values('00000000-0000-4000-8000-000000000001','Test','Owner'),('00000000-0000-4000-8000-000000000002','Test','Voter');`);
 await db.exec(await readFile("supabase/migrations/202610080001_caption_community.sql", "utf8"));
 await db.exec(await readFile("outputs/assignment-4/database-verification.sql", "utf8"));
 await db.exec(await readFile("outputs/assignment-4/database-regressions.sql", "utf8"));
 await db.exec(`create table public.travel_countries(code text primary key,name text);
 insert into public.travel_countries values('840','United States'),('392','Japan'),('250','France');
 create table public.country_visits(user_id uuid references public.profiles(id),country_code text references public.travel_countries(code));
 alter table public.travel_countries enable row level security;
 alter table public.country_visits enable row level security;
 grant select,insert,delete on public.country_visits to authenticated;`);
 await db.exec(await readFile("supabase/migrations/20261008165700_post_locations.sql", "utf8"));
 await db.exec(await readFile("outputs/assignment-4/database-location-verification.sql", "utf8"));
 console.log("Database migration and rollback authorization/quota/voting assertions passed in isolated PGlite.");
} catch (error) { console.error("Database assertion failed:", error.message); process.exitCode = 1; }
finally { await db.close(); }
