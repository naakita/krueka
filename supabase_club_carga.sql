-- ==================== KRUEKA · CLUB CARGA DIRECTA (migracion 042) ====================
-- club_alumno_crear: el admin/direccion carga un alumno directo sin pasar
-- por el formulario publico. Crea la inscripcion (aceptada, para guardar
-- tutor/telefono) + el alumno con codigo generado. Mismas convenciones:
-- SECURITY DEFINER, search_path fijo, is_admin()/is_direccion(), audit_log.
-- ============================================================================

create or replace function public.club_alumno_crear(
  p_nombre text, p_group uuid,
  p_tutor text default null, p_telefono text default null,
  p_email text default null, p_edad integer default null,
  p_comentario text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_inst uuid; v_cod text; v_req uuid; v_id uuid;
begin
  if not (public.is_admin() or public.is_direccion()) then raise exception 'No autorizado.'; end if;
  if coalesce(btrim(p_nombre),'') = '' then raise exception 'El nombre es obligatorio.'; end if;
  if coalesce(btrim(coalesce(p_tutor,'')),'') = '' then raise exception 'El tutor es obligatorio.'; end if;
  if coalesce(btrim(coalesce(p_telefono,'')),'') = '' then raise exception 'El telefono es obligatorio.'; end if;
  if p_group is null then raise exception 'Elegi el grupo.'; end if;
  select institution_id into v_inst from public.club_groups where id = p_group;
  if v_inst is null then raise exception 'Grupo no encontrado.'; end if;
  v_cod := public.club_codigo();
  insert into public.club_requests (institution_id, group_id, alumno, tutor, telefono,
      email, edad, comentario, estado)
  values (v_inst, p_group, btrim(p_nombre),
      nullif(btrim(coalesce(p_tutor,'')),''), nullif(btrim(coalesce(p_telefono,'')), ''),
      nullif(btrim(coalesce(p_email,'')),''), p_edad,
      nullif(btrim(coalesce(p_comentario,'')),''), 'aceptado')
  returning id into v_req;
  insert into public.club_students (institution_id, group_id, request_id, nombre, codigo)
  values (v_inst, p_group, v_req, btrim(p_nombre), v_cod)
  returning id into v_id;
  update public.club_requests set student_id = v_id where id = v_req;
  insert into public.audit_log (actor_id, accion, entidad, entidad_id, detalle)
  values (auth.uid(), 'club_alumno_crear', 'club_student', v_id,
          jsonb_build_object('nombre', btrim(p_nombre), 'codigo', v_cod, 'directa', true));
  return jsonb_build_object('student_id', v_id, 'codigo', v_cod, 'nombre', btrim(p_nombre));
end $$;
