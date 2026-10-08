-- Rollback-only test against the migrated database. Uses isolated test identities.
-- For the live project, create/use designated test accounts first; do not insert into auth.users ad hoc.
-- Local harness provisions profiles below before executing this script.
begin;
insert into public.moments(id,creator_id,photo_path,photo_revision) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/test.jpg','30000000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*) from public.moments)=0,'Other user read draft';
 begin perform public.caption_publish('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'); raise exception 'Cross-owner publish succeeded'; exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 assert public.caption_feed()='[]'::jsonb,'Draft appeared publicly';
 assert not public.caption_photo_visible('00000000-0000-4000-8000-000000000001/test.jpg'),'Private photo exposed';
 begin perform public.caption_vote('20000000-0000-4000-8000-000000000001',1::smallint); raise exception 'Guest vote succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid(),'s','{}','test','{}'); raise exception 'Guest reserve succeeded'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare r jsonb; req uuid; i integer; begin
 for i in 1..5 loop
  r:=public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid(),'system','{"context":"","location":"","style":"Funny","photoRevision":"30000000-0000-4000-8000-000000000001"}','test-model','{}');
  req:=(r->>'id')::uuid;
  if i=1 then
   begin perform public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid(),'system','{"context":"","location":"","style":"Funny","photoRevision":"30000000-0000-4000-8000-000000000001"}','test-model','{}'); raise exception 'Parallel reservation allowed'; exception when raise_exception then assert sqlerrm like 'A generation is already%','Wrong concurrent error'; end;
  end if;
  perform public.caption_finish('00000000-0000-4000-8000-000000000001',req,'["One","Two","Three"]');
  perform public.caption_finish('00000000-0000-4000-8000-000000000001',req,'["One","Two","Three"]');
 end loop;
 assert (select count(*) from public.generation_runs)=5,'Duplicate finalize duplicated batches';
 begin perform public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid(),'system','{"context":"","location":"","style":"Funny","photoRevision":"30000000-0000-4000-8000-000000000001"}','test-model','{}'); raise exception 'Sixth batch allowed'; exception when raise_exception then assert sqlerrm like 'Daily limit reached%','Wrong quota error'; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ declare c uuid; begin
 select id into c from public.captions limit 1;
 perform public.caption_publish('10000000-0000-4000-8000-000000000001',c);
 perform public.caption_publish('10000000-0000-4000-8000-000000000001',c);
 begin perform public.caption_vote(c,1::smallint); raise exception 'Self-vote allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ declare c uuid; result jsonb; begin
 c:=(public.caption_feed()->0->>'caption_id')::uuid;
 result:=public.caption_vote(c,1::smallint); assert result->>'score'='1';
 result:=public.caption_vote(c,1::smallint); assert (select count(*) from public.caption_votes)=1,'Duplicate vote';
 result:=public.caption_vote(c,-1::smallint); assert result->>'score'='-1';
 result:=public.caption_vote(c,null); assert result->>'score'='0'; assert (select count(*) from public.caption_votes)=0;
 assert (select count(*) from public.generation_runs)=0,'Prompts exposed';
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin
 perform public.caption_delete('10000000-0000-4000-8000-000000000001');
 assert public.caption_feed()='[]'::jsonb;
 assert public.caption_allowance()->>'remaining'='0','Deleting resets quota';
 assert (select count(*) from public.photo_cleanup_requests)=1,'Cleanup path lost';
end $$;
rollback;
