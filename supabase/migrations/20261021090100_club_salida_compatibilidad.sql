-- Krueka: compatibilidad del boton Desactivar y estado historico Salio.
alter table public.club_students add column if not exists salio_at timestamptz;
create index if not exists club_students_salio_at_idx on public.club_students (salio_at) where salio_at is not null;

-- p_nombre tiene que ser opcional: Desactivar solo envia p_student y p_activo.
-- Se conserva la misma identidad/orden de parametros y las autorizaciones existentes.
create or replace function public.club_alumno_guardar(
 p_student uuid, p_nombre text default null, p_group uuid default null,
 p_activo boolean default null, p_avatar text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_inst uuid; v_actor_inst uuid; v_actor_role text; v_prev text;
begin
 select role::text,institution_id into v_actor_role,v_actor_inst
 from public.profiles where id=auth.uid() and activo=true;
 if v_actor_role not in ('admin','director') or v_actor_role is null then
  raise exception 'No autorizado.' using errcode='42501';
 end if;
 if p_student is null then raise exception 'Alumno no valido.'; end if;
 select institution_id,nombre into v_inst,v_prev
 from public.club_students where id=p_student for update;
 if v_prev is null then raise exception 'Alumno no encontrado.'; end if;
 if v_actor_inst is not null and v_actor_inst<>v_inst then
  raise exception 'Alumno de otra institucion.' using errcode='42501';
 end if;
 if p_nombre is not null and length(btrim(p_nombre))<3 then
  raise exception 'Escribi nombre y apellido completos.';
 end if;
 if p_group is not null and not exists(
   select 1 from public.club_groups where id=p_group and institution_id=v_inst
 ) then raise exception 'El grupo no pertenece a esta institucion.'; end if;
 update public.club_students set
  nombre=coalesce(btrim(p_nombre),nombre),
  group_id=coalesce(p_group,group_id),
  activo=coalesce(p_activo,activo),
  salio_at=case when p_activo is true then null else salio_at end,
  avatar=coalesce(p_avatar,avatar)
 where id=p_student;
 insert into public.audit_log(actor_id,accion,entidad,entidad_id,detalle)
 values(auth.uid(),'club_alumno_editar','club_student',p_student,
  jsonb_build_object('nombre',p_nombre,'group',p_group,'activo',p_activo));
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.club_alumno_guardar(uuid,text,uuid,boolean,text) from public,anon;
grant execute on function public.club_alumno_guardar(uuid,text,uuid,boolean,text) to authenticated;

-- Marcar salida no elimina pagos, proyectos ni historial.
create or replace function public.club_alumno_salida(p_student uuid,p_salio boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_actor_role text;v_actor_inst uuid;v_student_inst uuid;v_nom text;
begin
 select role::text,institution_id into v_actor_role,v_actor_inst
 from public.profiles where id=auth.uid() and activo=true;
 if v_actor_role not in ('admin','director') or v_actor_role is null then
  raise exception 'No autorizado.' using errcode='42501';
 end if;
 if p_student is null or p_salio is null then raise exception 'Parametros invalidos.'; end if;
 select institution_id,nombre into v_student_inst,v_nom
 from public.club_students where id=p_student for update;
 if v_nom is null then raise exception 'Alumno no encontrado.'; end if;
 if v_actor_inst is not null and v_actor_inst<>v_student_inst then
  raise exception 'Alumno de otra institucion.' using errcode='42501';
 end if;
 update public.club_students set
   activo=not p_salio,
   salio_at=case when p_salio then now() else null end,
   device_id=case when p_salio then null else device_id end
 where id=p_student;
 insert into public.audit_log(actor_id,accion,entidad,entidad_id,detalle)
 values(auth.uid(),case when p_salio then 'club_alumno_salio' else 'club_alumno_reincorporado' end,
 'club_student',p_student,jsonb_build_object('nombre',v_nom,'salio',p_salio));
 return jsonb_build_object('ok',true,'salio',p_salio);
end $$;
revoke all on function public.club_alumno_salida(uuid,boolean) from public,anon;
grant execute on function public.club_alumno_salida(uuid,boolean) to authenticated;
notify pgrst,'reload schema';
