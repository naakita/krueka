-- Academia IA Junior · cada alumno usa un token vigente de Krueka Studio.
-- La tabla no está expuesta a anon/authenticated. El acceso se hace vía RPC validado.

create table if not exists public.club_ai_academy_progress (
  student_id uuid primary key references public.club_students(id) on delete cascade,
  state jsonb not null default '{"version":1,"entries":{}}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint club_ai_academy_state_object check (jsonb_typeof(state)='object')
);
alter table public.club_ai_academy_progress enable row level security;
revoke all on public.club_ai_academy_progress from public, anon, authenticated;

create or replace function public.club_ai_academy_state(p_token text, p_data jsonb default null)
returns jsonb language plpgsql security definer set search_path to ''
as $body$
declare v_student uuid; v_data jsonb;
begin
  if p_token is null or p_token !~ '^st-[a-f0-9]{64}$' then
    return jsonb_build_object('ok',false,'error','Volvé a ingresar con tu código personal.');
  end if;
  select ss.student_id into v_student
    from public.club_studio_sessions ss
    join public.club_students cs on cs.id=ss.student_id
   where ss.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
     and not ss.revoked and ss.expires_at>now() and cs.activo
   limit 1;
  if v_student is null then
    return jsonb_build_object('ok',false,'error','La sesión terminó. Volvé a entrar.');
  end if;
  if p_data is not null then
    if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>26000
       or jsonb_typeof(p_data->'entries')<>'object' then
      return jsonb_build_object('ok',false,'error','El avance no tiene un formato válido.');
    end if;
    insert into public.club_ai_academy_progress(student_id,state,updated_at)
    values(v_student,p_data,now())
    on conflict(student_id) do update set state=excluded.state,updated_at=now();
  end if;
  select state into v_data from public.club_ai_academy_progress where student_id=v_student;
  return jsonb_build_object('ok',true,'data',coalesce(v_data,'{"version":1,"entries":{}}'::jsonb));
end;
$body$;
revoke all on function public.club_ai_academy_state(text,jsonb) from public;
grant execute on function public.club_ai_academy_state(text,jsonb) to anon,authenticated;
