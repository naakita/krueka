-- Allows an active Studio session to delete exactly one of its own private drafts.
-- Creating this RPC does not delete or change any existing projects.
create or replace function public.club_studio_borrar_borrador(
  p_student uuid, p_device text, p_project uuid, p_updated_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_project public.club_creator_projects%rowtype;
begin
  -- Do not authorize permanent deletion with a remembered device ID.
  if coalesce(p_device, '') !~ '^st-[a-f0-9]{64}$'
     or not exists (
      select 1
      from public.club_studio_sessions a
      join public.club_students s on s.id = a.student_id
      where s.id = p_student and s.activo
        and public.club_crea_estudiante_valido(s.id, p_device)
        and not a.revoked and a.expires_at > now()
        and a.token_hash = encode(extensions.digest(p_device, 'sha256'), 'hex')
        and a.code_hash = encode(extensions.digest(s.codigo, 'sha256'), 'hex')
  ) then
    return jsonb_build_object('ok', false, 'code', 'session', 'error', 'Volvé a entrar al Club con tu código personal.');
  end if;

  select p.* into v_project
  from public.club_creator_projects p
  join public.club_students s on s.id = p.student_id and s.institution_id = p.institution_id
  where p.id = p_project and p.student_id = p_student and p.type = 'web'
    and jsonb_typeof(p.content#>'{studio,files}') = 'object'
  for update of p;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'missing', 'error', 'Este proyecto ya no aparece en tus borradores.');
  end if;
  if v_project.status <> 'draft' then
    return jsonb_build_object('ok', false, 'code', 'protected', 'error', 'Solo se pueden borrar borradores privados.');
  end if;
  if p_updated_at is null or v_project.updated_at is distinct from p_updated_at then
    return jsonb_build_object('ok', false, 'code', 'changed', 'error', 'El proyecto cambió. Volvé a la lista y revisá la versión actual antes de borrarlo.');
  end if;
  if exists (select 1 from public.club_creator_assets a where a.project_id = p_project) then
    return jsonb_build_object('ok', false, 'code', 'assets', 'error', 'Este proyecto tiene archivos vinculados. Pedile ayuda al profe para no perderlos.');
  end if;

  delete from public.club_creator_projects where id = v_project.id and student_id = p_student;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.club_studio_borrar_borrador(uuid,text,uuid,timestamptz) from public;
grant execute on function public.club_studio_borrar_borrador(uuid,text,uuid,timestamptz) to anon, authenticated;
