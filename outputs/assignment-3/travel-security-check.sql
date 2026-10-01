begin;
select set_config('request.jwt.claims', json_build_object('sub',id,'role','authenticated')::text, true), set_config('app.qa_owner',id::text,true) from auth.users where lower(email)='lkr2124@columbia.edu';
set local role authenticated;
do $$ begin
  assert (select count(*) from public.country_visits)=5, 'Owner must see five visits';
  insert into public.country_visits(user_id,country_code) values(auth.uid(),'124');
  assert (select count(*) from public.country_visits)=6, 'Owner insert failed';
  delete from public.country_visits where user_id=auth.uid() and country_code='124';
  assert (select count(*) from public.country_visits)=5, 'Owner delete failed';
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
do $$ begin
  assert (select count(*) from public.country_visits)=0, 'Other identities must not read visits';
  begin
    insert into public.country_visits(user_id,country_code) values(current_setting('app.qa_owner')::uuid,'124');
    raise exception 'Cross-owner insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  assert (select sum(visitor_count) from public.community_country_visits())=5, 'Aggregate count incorrect';
end $$;
set local role anon;
do $$ begin
  assert (select count(*) from public.community_country_visits())=5, 'Anonymous map not available';
  begin
    perform * from public.country_visits;
    raise exception 'Anonymous direct reads unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;