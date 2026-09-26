-- Pendiente de aplicar SOLO al proyecto de producción correcto, después de revisar
-- club_students/club_entrar y hacer respaldo. No cambia datos preexistentes.
create table if not exists public.club_mentor_usage (
  student_id uuid not null references public.club_students(id) on delete cascade,
  dia date not null,
  preguntas integer not null default 0 check (preguntas between 0 and 15),
  primary key (student_id, dia)
);
alter table public.club_mentor_usage enable row level security;
revoke all on public.club_mentor_usage from anon, authenticated;

-- La función se ejecuta con los privilegios del llamante; solo el servicio
-- del servidor puede reservar una pregunta. Un UPSERT hace el cupo atómico.
create or replace function public.club_mentor_reservar(p_student uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_ok boolean := false;
begin
  if coalesce(current_setting('request.jwt.claim.role', true),'') <> 'service_role' then
    return false;
  end if;
  if not exists (select 1 from public.club_students where id=p_student and activo) then
    return false;
  end if;
  insert into public.club_mentor_usage(student_id,dia,preguntas)
  values (p_student,(now() at time zone 'America/Asuncion')::date,1)
  on conflict (student_id,dia) do update
  set preguntas=public.club_mentor_usage.preguntas+1
  where public.club_mentor_usage.preguntas<15
  returning true into v_ok;
  return coalesce(v_ok,false);
end $$;
revoke all on function public.club_mentor_reservar(uuid) from public, anon, authenticated;
grant execute on function public.club_mentor_reservar(uuid) to service_role;
