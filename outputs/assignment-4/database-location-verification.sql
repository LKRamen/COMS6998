-- Rollback-only fixture: local harness creates profiles. No photo/provider calls.
begin;
insert into public.moments(id,creator_id,photo_path,photo_revision) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/map-test.jpg','30000000-0000-4000-8000-000000000001');
do $$ declare r jsonb; begin
 r:=public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid(),'historical system','{"context":"","location":"","style":"Funny","photoRevision":"30000000-0000-4000-8000-000000000001"}','test','{}');
 perform public.caption_finish('00000000-0000-4000-8000-000000000001',(r->>'id')::uuid,'["One","Two","Three"]');
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ declare c uuid; begin
 select id into c from public.captions limit 1;
 begin perform public.caption_publish('10000000-0000-4000-8000-000000000001',c); raise exception 'Missing location published'; exception when raise_exception then assert sqlerrm='Select a location before publishing.'; end;
 perform public.caption_set_location('10000000-0000-4000-8000-000000000001','Central Park, New York, United States','840');
 assert (select count(*) from public.community_country_visits())=0,'Draft changed map';
 perform public.caption_publish('10000000-0000-4000-8000-000000000001',c);
 assert (select visitor_count from public.community_country_visits() where country_code='840')=1,'Published post missing on atlas';
 assert jsonb_array_length(public.caption_feed_country('new',0,'840'))=1;
 assert public.caption_feed_country('new',0,'392')='[]'::jsonb;
 begin perform public.caption_set_location('10000000-0000-4000-8000-000000000001','',null); raise exception 'Published country cleared'; exception when raise_exception then assert sqlerrm='Published posts require a location.'; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ declare c uuid; begin
 c:=(public.caption_feed()->0->>'caption_id')::uuid;
 perform public.caption_vote(c,1::smallint);
 begin perform public.caption_set_location('10000000-0000-4000-8000-000000000001','Japan','392'); raise exception 'Other owner edited location'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin
 perform public.caption_set_location('10000000-0000-4000-8000-000000000001','Japan','392');
 assert (select count(*) from public.community_country_visits() where country_code='840')=0,'Old country remained';
 assert (select visitor_count from public.community_country_visits() where country_code='392')=1,'New country missing';
 assert public.caption_feed()->0->>'score'='1','Correction lost votes';
 assert public.caption_feed()->0->>'text' in ('One','Two','Three'),'Correction changed caption';
 assert (select location from public.generation_runs limit 1)='','Correction rewrote historical location';
 assert (select system_prompt from public.generation_runs limit 1)='historical system';
 perform public.caption_delete('10000000-0000-4000-8000-000000000001');
 assert (select count(*) from public.community_country_visits())=0,'Last post deletion left map entry';
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 begin perform public.caption_set_location('10000000-0000-4000-8000-000000000001','Japan','392'); raise exception 'Guest edit granted'; exception when insufficient_privilege then null; end;
 assert (select count(*) from public.community_country_visits())=0;
end $$;
reset role;
do $$ declare m uuid; g uuid; c uuid; i integer; ids uuid[]:='{}'; begin
 for i in 1..2 loop
  m:=gen_random_uuid(); g:=gen_random_uuid(); c:=gen_random_uuid();
  ids:=array_append(ids,m);
  insert into public.moments(id,creator_id,photo_path,location,country_code) values(m,'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/'||m::text||'.jpg','United States','840');
  insert into public.generation_runs(id,moment_id,creator_id,photo_revision,photo_path,request_key,context,location,style,system_prompt,user_prompt,model,settings)
   select g,id,creator_id,photo_revision,photo_path,gen_random_uuid(),'','United States','Funny','test','test','test','{}' from public.moments where id=m;
  insert into public.captions(id,generation_run_id,moment_id,creator_id,ordinal,text) values(c,g,m,'00000000-0000-4000-8000-000000000001',1,'Map counter test');
  update public.moments set status='published',selected_caption_id=c,public_location=location,public_style='Funny',author_name='Test',published_at=now() where id=m;
 end loop;
 assert (select visitor_count from public.community_country_visits() where country_code='840')=2,'Same-author posts were deduplicated';
 delete from public.moments where id=m;
 assert (select visitor_count from public.community_country_visits() where country_code='840')=1,'Deleting one post removed country';
 delete from public.moments where id=any(ids);
 assert (select count(*) from public.community_country_visits())=0;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ begin
 begin insert into public.country_visits(user_id,country_code) values('00000000-0000-4000-8000-000000000001','840'); raise exception 'Legacy manual insert granted'; exception when insufficient_privilege then null; end;
 begin delete from public.country_visits; raise exception 'Legacy manual delete granted'; exception when insufficient_privilege then null; end;
end $$;
rollback;
