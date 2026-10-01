-- Prepared for swmgfanscadzfkqoctle; NOT applied in this session.
-- Inspect existing schema/policies with supabase-coms6998 before applying.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text null check (first_name is null or char_length(first_name) <= 80),
  last_name text null check (last_name is null or char_length(last_name) <= 80),
  avatar_path text null,
  created_at timestamptz not null default now(),
  constraint profiles_own_avatar check (
    avatar_path is null or split_part(avatar_path, '/', 1) = id::text
  )
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, avatar_path) on public.profiles to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- An internal trigger needs elevated privileges because auth creates the user.
-- Names remain NULL so users explicitly supply both names during onboarding.
create schema if not exists private;
create function private.assignment3_create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.assignment3_create_profile() from public, anon, authenticated;

create trigger assignment3_auth_user_created
after insert on auth.users
for each row execute function private.assignment3_create_profile();

-- Cover users who signed up before the trigger was installed.
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- Store image bytes in Storage, never in the profiles table.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create policy assignment3_avatar_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy assignment3_avatar_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy assignment3_avatar_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
