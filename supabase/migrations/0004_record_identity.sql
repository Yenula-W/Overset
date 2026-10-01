-- A record cannot be moved into another collection to bypass insert guards.
create function private.guard_record_identity() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.store is distinct from old.store or new.id is distinct from old.id then
   raise exception 'Record identity cannot be changed.';
 end if;
 if coalesce(auth.role(), '') <> 'service_role' and new.store = 'team' then
   if new.data ->> 'role' not in ('translator','proofreader','typesetter','viewer') then raise exception 'Invalid team role.'; end if;
   if exists(select 1 from public.records where store='team' and owner_id=new.owner_id and id<>new.id and lower(trim(data ->> 'email'))=lower(trim(new.data ->> 'email'))) then raise exception 'That person is already on your team.'; end if;
 end if;
 return new;
end $$;
create trigger guard_record_identity before update on public.records for each row execute function private.guard_record_identity();
-- Normalize the label used by the editor; snapshots themselves are retained.
update public.records set data=jsonb_set(data,'{kind}','"ai_translation"') where store='versions' and data ->> 'kind'='translation';

create or replace function public.finish_page(task text, token text, page text, expected jsonb, regions jsonb, result_data jsonb, model_name text, tokens_in integer, tokens_out integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare job public.processing_tasks;
begin
 select * into job from public.processing_tasks where id=task and lease=token and state='running' for update;
 if not found then return false; end if;
 perform 1 from public.records where store='pages' and id=page and owner_id=job.owner_id and data -> 'regions' = expected for update;
 if not found then
   update public.processing_tasks set state='failed',updated_at=now() where id=task;
   return false;
 end if;
 -- Preserve a full region snapshot for restore/audit before machine edits.
 insert into public.records(store,id,owner_id,data) values('versions','ver_'||token,job.owner_id,jsonb_build_object('id','ver_'||token,'ownerId',job.owner_id::text,'pageId',page,'chapterId',(select data ->> 'chapterId' from public.records where store='pages' and id=page),'kind','ai_translation','actor','AI','summary',job.action||' generated','createdAt',now(),'regionSnapshot',expected));
 update public.records set data=jsonb_set(data,'{regions}',regions) where store='pages' and id=page and owner_id=job.owner_id;
 update public.processing_tasks set state='complete',result=result_data,model=model_name,input_tokens=tokens_in,output_tokens=tokens_out,updated_at=now() where id=task;
 return true;
end $$;
