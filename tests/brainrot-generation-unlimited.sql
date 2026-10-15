begin;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
insert into public.moments(id,creator_id,photo_path,style) values('10000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001/unlimited.jpg','Brainrot');
do $$ declare reservation jsonb; prompt text; first_key uuid:=gen_random_uuid(); first_id uuid; begin
 select jsonb_build_object('context',context,'location',location,'style',style,'photoRevision',photo_revision)::text into prompt from public.moments where id='10000000-0000-4000-8000-000000000009';
 for i in 1..7 loop
  reservation:=public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000009',case when i=1 then first_key else gen_random_uuid() end,'test image-only prompt',prompt,'test','{}');
  if i=1 then first_id:=(reservation->>'id')::uuid; end if;
  begin
   perform public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000009',gen_random_uuid(),'test image-only prompt',prompt,'test','{}');
   raise exception 'Concurrent request accepted';
  exception when raise_exception then
   if sqlerrm<>'A generation is already running. Please wait.' then raise; end if;
  end;
  perform public.caption_finish('00000000-0000-4000-8000-000000000001',(reservation->>'id')::uuid,'["Test one","Test two","Test three"]');
 end loop;
 reservation:=public.caption_reserve('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000009',first_key,'test image-only prompt',prompt,'test','{}');
 if not (reservation->>'reused')::boolean or (reservation->>'id')::uuid<>first_id then raise exception 'Idempotence lost'; end if;
 if (select count(*) from public.generation_requests where moment_id='10000000-0000-4000-8000-000000000009' and state='succeeded')<>7 then raise exception 'Daily cap still active'; end if;
 if public.caption_allowance()->>'remaining' is not null or (public.caption_allowance()->>'unlimited')::boolean is distinct from true then raise exception 'Allowance still capped'; end if;
 if has_function_privilege('authenticated','public.caption_reserve(uuid,uuid,uuid,text,text,text,jsonb)','execute') then raise exception 'Generation write privilege widened'; end if;
end $$;
rollback;
