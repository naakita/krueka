-- Krueka: asistencia escolar por grado/curso y fecha (sin abrir una sesion de materia).
-- Los datos se consultan y modifican SOLO mediante RPC autenticadas con control
-- de institucion y asignacion docente; se conservan las asistencias de clase previas.
create table if not exists public.asistencia_grado (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id),
 student_id uuid not null references public.students(id),
 fecha date not null,
 estado text not null check(estado in ('presente','ausente','tarde','justificado')),
 observacion text not null default '' check(char_length(observacion)<=500),
 registrado_por uuid not null references public.profiles(id),
 registrado_at timestamptz not null default now(),
 unique(course_id,fecha,student_id)
);
create index if not exists asistencia_grado_curso_fecha on public.asistencia_grado(course_id,fecha);
alter table public.asistencia_grado enable row level security;
revoke all on public.asistencia_grado from public,anon,authenticated;
-- La tabla no tiene politicas de acceso directo. Solo las tres RPC siguientes.

create or replace function public.asistencia_grado_cursos()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_inst uuid;v_role text;v_rows jsonb;
begin
 select p.institution_id,p.role::text into v_inst,v_role
 from public.profiles p where p.id=auth.uid() and p.activo=true;
 if v_inst is null or v_role not in ('admin','director','docente') then
  raise exception 'No tenes permiso para ver listas.' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'nombre',q.nombre) order by q.nombre),'[]'::jsonb)
 into v_rows from (
  select c.id,c.nombre from public.courses c
  where c.institution_id=v_inst and
   (v_role in ('admin','director') or exists(
    select 1 from public.course_subjects cs
    where cs.course_id=c.id and cs.teacher_id=auth.uid()))
 )q;
 return v_rows;
end $$;

create or replace function public.asistencia_grado_lista(p_course uuid,p_fecha date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_inst uuid;v_role text;v_curso text;v_fecha date;
        v_alumnos jsonb;
begin
 select p.institution_id,p.role::text into v_inst,v_role
 from public.profiles p where p.id=auth.uid() and p.activo=true;
 if v_inst is null or v_role not in ('admin','director','docente') then
  raise exception 'No tenes permiso para consultar asistencias.' using errcode='42501';
 end if;
 select c.nombre into v_curso from public.courses c
 where c.id=p_course and c.institution_id=v_inst;
 if v_curso is null or
   (v_role='docente' and not exists (
    select 1 from public.course_subjects cs
    where cs.course_id=p_course and cs.teacher_id=auth.uid())) then
  raise exception 'Grado no autorizado.' using errcode='42501';
 end if;
 v_fecha:=coalesce(p_fecha,(now() at time zone 'America/Asuncion')::date);
 if v_fecha < date '2020-01-01' or v_fecha > (now() at time zone 'America/Asuncion')::date then
  raise exception 'Selecciona una fecha valida (hoy o anterior).';
 end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id', t.student_id, 'nombre',t.nombre, 'numero',t.numero_lista,
  'estado',r.estado,'observacion',r.observacion,
  'registrado_por',p.nombre,'registrado_at',r.registrado_at
 ) order by t.numero_lista nulls last,t.nombre),'[]'::jsonb)
 into v_alumnos from (
  select distinct on(st.id) st.id student_id,st.nombre,e.numero_lista
  from public.students st
  join public.enrollments e on e.student_id=st.id
  where e.course_id=p_course
    and st.institution_id=v_inst
    and ((st.activo and e.activo) or exists(
      select 1 from public.asistencia_grado ar where ar.course_id=p_course
       and ar.student_id=st.id and ar.fecha=v_fecha))
  order by st.id,e.numero_lista nulls last
 )t
 left join public.asistencia_grado r on r.course_id=p_course and r.student_id=t.student_id and r.fecha=v_fecha
 left join public.profiles p on p.id=r.registrado_por;
 return jsonb_build_object('curso',v_curso,'fecha',v_fecha,'alumnos',v_alumnos);
end $$;

create or replace function public.asistencia_grado_guardar(
 p_course uuid,p_fecha date,p_entries jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_inst uuid;v_role text;v_fecha date;v_item jsonb;v_student uuid;v_estado text;
        v_obs text;v_count int:=0;
begin
 select p.institution_id,p.role::text into v_inst,v_role
 from public.profiles p where p.id=auth.uid() and p.activo=true;
 if v_inst is null or v_role not in ('admin','director','docente') then
  raise exception 'No tenes permiso para guardar asistencias.' using errcode='42501';
 end if;
 if not exists(select 1 from public.courses c where c.id=p_course and c.institution_id=v_inst)
   or (v_role='docente' and not exists(
    select 1 from public.course_subjects cs
    where cs.course_id=p_course and cs.teacher_id=auth.uid())) then
  raise exception 'Grado no autorizado.' using errcode='42501';
 end if;
 v_fecha:=coalesce(p_fecha,(now() at time zone 'America/Asuncion')::date);
 if v_fecha<date '2020-01-01' or v_fecha>(now() at time zone 'America/Asuncion')::date then
  raise exception 'Selecciona una fecha valida (hoy o anterior).';
 end if;
 if p_entries is null or jsonb_typeof(p_entries)<>'array'
   or jsonb_array_length(p_entries)<1 or jsonb_array_length(p_entries)>250 then
  raise exception 'Envia entre 1 y 250 alumnos.';
 end if;
 for v_item in select value from jsonb_array_elements(p_entries) as x(value) loop
  if jsonb_typeof(v_item)<>'object' then raise exception 'Registro de asistencia invalido.'; end if;
  v_student:=(v_item->>'student_id')::uuid;
  v_estado:=v_item->>'estado';
  v_obs:=coalesce(v_item->>'observacion','');
  if v_estado not in ('presente','ausente','tarde','justificado') or v_estado is null or char_length(v_obs)>500 then
   raise exception 'Estado u observacion invalida.';
  end if;
  if not exists(select 1 from public.students st
    join public.enrollments e on e.student_id=st.id
    where st.id=v_student and st.institution_id=v_inst and e.course_id=p_course
      and ((st.activo and e.activo) or exists(
       select 1 from public.asistencia_grado ar where ar.course_id=p_course
         and ar.fecha=v_fecha and ar.student_id=v_student))) then
   raise exception 'Alumno no pertenece a la lista activa del grado.';
  end if;
  insert into public.asistencia_grado(course_id,student_id,fecha,estado,observacion,registrado_por,registrado_at)
   values(p_course,v_student,v_fecha,v_estado,v_obs,auth.uid(),now())
  on conflict(course_id,fecha,student_id) do update
   set estado=excluded.estado,observacion=excluded.observacion,
       registrado_por=excluded.registrado_por,registrado_at=excluded.registrado_at;
  v_count:=v_count+1;
 end loop;
 return jsonb_build_object('ok',true,'guardados',v_count,'fecha',v_fecha);
end $$;
revoke all on function public.asistencia_grado_cursos() from public,anon;
revoke all on function public.asistencia_grado_lista(uuid,date) from public,anon;
revoke all on function public.asistencia_grado_guardar(uuid,date,jsonb) from public,anon;
grant execute on function public.asistencia_grado_cursos() to authenticated;
grant execute on function public.asistencia_grado_lista(uuid,date) to authenticated;
grant execute on function public.asistencia_grado_guardar(uuid,date,jsonb) to authenticated;
notify pgrst,'reload schema';
