-- Distingue los proyectos Studio de otros proyectos web del mismo alumno.
create or replace function public.club_studio_proyectos(p_student uuid,p_device text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.club_crea_estudiante_valido(p_student,p_device) then
  raise exception 'Volvé a entrar al taller con tu código personal.';
 end if;
 return (select coalesce(jsonb_agg(p.id order by p.updated_at desc),'[]'::jsonb)
  from public.club_creator_projects p where p.student_id=p_student and p.type='web'
  and p.status<>'archived' and jsonb_typeof(p.content#>'{studio,files}')='object');
end;$$;
revoke all on function public.club_studio_proyectos(uuid,text) from public;
grant execute on function public.club_studio_proyectos(uuid,text) to anon,authenticated;
