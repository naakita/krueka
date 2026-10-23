-- Modo DEMO de Academia IA: autorización solo para cuentas docentes o administradoras.
-- La función no devuelve información personal ni permite ver/modificar trabajos de alumnos.

create or replace function public.club_ai_teacher_demo_allowed()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid())
       and p.activo = true
       and p.role::text in ('admin', 'docente')
  );
$$;
revoke all on function public.club_ai_teacher_demo_allowed() from public, anon;
grant execute on function public.club_ai_teacher_demo_allowed() to authenticated;
