begin;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.brainrot_save_profile('test_owner','Test Owner','A test bio',null);
reset role;
insert into public.moments(id,creator_id,photo_path,style) values('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/photo.jpg','Brainrot');
insert into public.generation_runs(id,moment_id,creator_id,photo_revision,photo_path,request_key,context,location,style,system_prompt,user_prompt,model,settings)
select '20000000-0000-4000-8000-000000000001',id,creator_id,photo_revision,photo_path,gen_random_uuid(),'','','Brainrot','private prompt','private context','test','{}' from public.moments;
insert into public.captions(id,generation_run_id,moment_id,creator_id,ordinal,text) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',1,'Original AI caption');
insert into storage.objects(name,bucket_id) values('00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/render.jpg','caption-photos');
set local role authenticated;
select public.brainrot_publish('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','My edited AI caption','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/render.jpg');
-- Publication is idempotent, independent of the old location requirement.
select public.brainrot_publish('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','My edited AI caption','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/render.jpg');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 if jsonb_array_length(public.brainrot_discover('swipe',null,null,null,0))<>1 then raise exception 'Unvoted item missing'; end if;
 perform public.caption_vote('30000000-0000-4000-8000-000000000001',1::smallint);
 perform public.caption_vote('30000000-0000-4000-8000-000000000001',1::smallint);
 if jsonb_array_length(public.brainrot_discover('swipe',null,null,null,0))<>0 then raise exception 'Voted item returned'; end if;
 if jsonb_array_length(public.brainrot_discover('new','test_owner',null,null,0))<>1 then raise exception 'Creator search failed'; end if;
 if jsonb_array_length(public.brainrot_discover('new','nomatch',null,null,0))<>0 then raise exception 'Search not filtered'; end if;
 if (public.brainrot_discover('new',null,null,null,0)->0->>'score')::int<>1 then raise exception 'Duplicate vote or wrong score'; end if;
 if (select count(*) from public.generation_runs)<>0 then raise exception 'Private prompt visible'; end if;
 if (select count(*) from public.profiles where username='test_owner')<>0 then raise exception 'Private profile visible'; end if;
 begin
  perform public.brainrot_publish('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','hijack','00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/render.jpg');
  raise exception 'Cross-user publish allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
 if public.brainrot_profile('test_owner')->>'bio'<>'A test bio' then raise exception 'Public profile missing'; end if;
 if public.brainrot_profile('test_owner') ? 'last_name' then raise exception 'Private name exposed'; end if;
 if public.brainrot_discover('new',null,null,null,0)->0->>'text'<>'My edited AI caption' then raise exception 'Edited caption missing'; end if;
 if not public.caption_photo_visible('00000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000001/render.jpg') then raise exception 'Rendered asset invisible'; end if;
 begin
  perform public.caption_vote('30000000-0000-4000-8000-000000000001',1::smallint);
  raise exception 'Anonymous vote allowed';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
