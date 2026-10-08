-- Isolated rollback regressions. Live execution requires designated test identities.
begin;
insert into public.moments(id,creator_id,photo_path,photo_revision,location,style) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/original.jpg','30000000-0000-4000-8000-000000000001','Original location','Postcard');
set local role service_role;
do $$ declare u uuid:='00000000-0000-4000-8000-000000000001'; m uuid:='10000000-0000-4000-8000-000000000001'; r jsonb; req uuid; prompt text; revision uuid; begin
 prompt:='{"context":"","location":"Original location","style":"Postcard","photoRevision":"30000000-0000-4000-8000-000000000001"}';
 r:=public.caption_reserve(u,m,gen_random_uuid(),'system',prompt,'test','{}'); req:=(r->>'id')::uuid;
 begin perform public.caption_finish(u,req,'["same","Same","third"]'); raise exception 'Duplicate output accepted'; exception when raise_exception then assert sqlerrm='Invalid or duplicate captions.'; end;
 assert (select count(*) from public.generation_runs)=0,'Invalid output left a partial batch';
 perform public.caption_fail(u,req);
 r:=public.caption_reserve(u,m,gen_random_uuid(),'system',prompt,'test','{}'); req:=(r->>'id')::uuid;
 perform public.caption_replace_photo(u,m,u::text||'/replacement-one.jpg','','First replacement','Witty');
 perform public.caption_replace_photo(u,m,u::text||'/replacement-two.jpg','','Second replacement','Funny');
 assert (select count(*) from public.photo_cleanup_requests)=2,'Sequential replacements lost an intermediate cleanup path';
 assert exists(select 1 from public.photo_cleanup_requests where photo_path=u::text||'/replacement-one.jpg');
 begin perform public.caption_finish(u,req,'["One","Two","Three"]'); raise exception 'Old photo generation saved'; exception when raise_exception then assert sqlerrm='Draft changed or was removed.'; end;
 perform public.caption_fail(u,req);
 begin perform public.caption_reserve(u,m,gen_random_uuid(),'system',prompt,'test','{}'); raise exception 'Stale photo prompt accepted'; exception when raise_exception then assert sqlerrm='Draft changed. Save and try again.'; end;
 select photo_revision into revision from public.moments where id=m;
 prompt:=jsonb_build_object('context','','location','Second replacement','style','Funny','photoRevision',revision)::text;
 r:=public.caption_reserve(u,m,gen_random_uuid(),'system',prompt,'test','{}'); req:=(r->>'id')::uuid;
 update public.generation_requests set lease_expires_at=now()-interval '1 second' where id=req;
 begin perform public.caption_finish(u,req,'["One","Two","Three"]'); raise exception 'Expired result accepted'; exception when raise_exception then assert sqlerrm='Generation expired. Please try again.'; end;
 r:=public.caption_reserve(u,m,gen_random_uuid(),'system',prompt,'test','{}');
 assert (select state from public.generation_requests where id=req)='expired','Lease not reclaimed';
 perform public.caption_finish(u,(r->>'id')::uuid,'["Current one","Current two","Current three"]');
 assert (select photo_path from public.generation_runs limit 1)=u::text||'/replacement-two.jpg','Generation photo path snapshot lost';
 assert (select g.request_key=q.request_key from public.generation_runs g join public.generation_requests q on q.run_id=g.id limit 1),'Generation request provenance lost';
end $$;
reset role;
insert into storage.objects(id,name,bucket_id) values
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001/original.jpg','caption-photos'),
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001/replacement-one.jpg','caption-photos'),
 (gen_random_uuid(),'00000000-0000-4000-8000-000000000001/replacement-two.jpg','caption-photos');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin assert (select count(*) from storage.objects)=0,'Guest read draft or orphan photo'; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
do $$ declare c uuid; begin
 assert (select count(*) from storage.objects)=1,'Owner should see only current photo';
 assert public.caption_allowance()->>'remaining'='4','Failed/expired generations consumed successful allowance';
 select id into c from public.captions where text='Current one';
 perform public.caption_save_draft('10000000-0000-4000-8000-000000000001','Changed private context','Unrelated location','Postcard',c);
 perform public.caption_publish('10000000-0000-4000-8000-000000000001',c);
 assert public.caption_feed()->0->>'location'='Second replacement','Publication ignored the selected batch snapshot';
 assert public.caption_feed()->0->>'style'='Funny','Publication changed caption style';
 assert not ((public.caption_feed()->0) ? 'context'),'Public feed exposed context';
 begin update public.moments set location='Direct bypass'; raise exception 'Direct mutation granted'; exception when insufficient_privilege then null; end;
 begin perform public.caption_save_draft('10000000-0000-4000-8000-000000000001','','Changed','Funny',c); raise exception 'Published post changed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*) from storage.objects)=1,'Published photo not readable';
 assert (select count(*) from public.captions)=0,'Unselected captions exposed';
 assert (select count(*) from public.photo_cleanup_requests)=0,'Another owner cleanup paths exposed';
 begin perform public.caption_replace_photo('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','fake','','','Funny'); raise exception 'Browser privileged replacement granted'; exception when insufficient_privilege then null; end;
 perform public.caption_delete('10000000-0000-4000-8000-000000000001');
 assert jsonb_array_length(public.caption_feed())=1,'Other owner deleted post';
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin assert (select count(*) from storage.objects)=1,'Guest should see published current photo only'; end $$;
rollback;
