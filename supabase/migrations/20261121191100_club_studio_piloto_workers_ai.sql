alter table public.club_studio_ai_requests drop constraint club_studio_ai_requests_model_check,
 add constraint club_studio_ai_requests_model_check check (model in ('gpt-6-luna','@cf/qwen/qwen2.5-coder-32b-instruct','@cf/black-forest-labs/flux-1-schnell'));

create function public.club_studio_ai_pilot_reserve(p_student uuid,p_device text,p_model text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if p_model is null or p_model not in ('@cf/qwen/qwen2.5-coder-32b-instruct','@cf/black-forest-labs/flux-1-schnell') then raise exception 'Modelo de piloto inválido'; end if;
 result:=public.club_studio_ai_reserve(p_student,p_device,1);
 if (result->>'ok')::boolean then
  update public.club_studio_ai_requests set model=p_model where id=(result->>'requestId')::uuid;
 end if;
 return result;
end;$$;
revoke all on function public.club_studio_ai_pilot_reserve(uuid,text,text) from public,anon,authenticated;
grant execute on function public.club_studio_ai_pilot_reserve(uuid,text,text) to service_role;
