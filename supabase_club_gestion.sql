-- ==================== KRUEKA · CLUB GESTION (migracion 041) ====================
-- Correr en Supabase > SQL Editor (o via DIRECT_URL session pooler).
-- 1. club_alumno_eliminar  - borra definitivo un alumno (CASCADE limpia
--    progreso, pagos, accesos, equipos y archivos). Solo admin/direccion.
-- 2. club_alumno_fusionar  - pasa los pagos del duplicado al que queda y
--    borra el duplicado. Solo admin/direccion.
-- 3. club_finanzas          - tablero: KPIs, deudores del mes actual y del
--    anterior, cobro por grupo, altas, bajas y ultimos 6 meses.
-- Convenciones iguales al resto del club: SECURITY DEFINER, search_path
-- fijo, control is_admin()/is_direccion() y registro en audit_log.
-- ============================================================================

create or replace function public.club_alumno_eliminar(p_student uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_nom text; v_cod text; v_np int; v_tot numeric;
begin
  if not (public.is_admin() or public.is_direccion()) then raise exception 'No autorizado.'; end if;
  select s.nombre, s.codigo into v_nom, v_cod from public.club_students s where s.id = p_student;
  if v_nom is null then raise exception 'Alumno no encontrado.'; end if;
  select count(*), coalesce(sum(monto),0) into v_np, v_tot
  from public.club_payments where student_id = p_student;
  delete from public.club_students where id = p_student;
  insert into public.audit_log (actor_id, accion, entidad, entidad_id, detalle)
  values (auth.uid(), 'club_alumno_eliminar', 'club_student', p_student,
          jsonb_build_object('nombre', v_nom, 'codigo', v_cod, 'pagos', v_np, 'total_pagado', v_tot));
  return jsonb_build_object('ok', true, 'nombre', v_nom, 'pagos', v_np);
end $$;

create or replace function public.club_alumno_fusionar(p_queda uuid, p_saca uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_nq text; v_ns text; v_nmov int; v_inst uuid;
begin
  if not (public.is_admin() or public.is_direccion()) then raise exception 'No autorizado.'; end if;
  if p_queda = p_saca then raise exception 'Elegi dos alumnos distintos.'; end if;
  select institution_id, nombre into v_inst, v_nq from public.club_students where id = p_queda;
  if v_nq is null then raise exception 'Alumno destino no encontrado.'; end if;
  select nombre into v_ns from public.club_students where id = p_saca and institution_id = v_inst;
  if v_ns is null then raise exception 'Alumno a fusionar no encontrado o de otra institucion.'; end if;
  update public.club_payments set student_id = p_queda where student_id = p_saca;
  get diagnostics v_nmov = row_count;
  update public.club_students q set request_id = coalesce(q.request_id, s.request_id)
  from public.club_students s where q.id = p_queda and s.id = p_saca;
  delete from public.club_students where id = p_saca;
  insert into public.audit_log (actor_id, accion, entidad, entidad_id, detalle)
  values (auth.uid(), 'club_alumno_fusionar', 'club_student', p_queda,
          jsonb_build_object('queda', v_nq, 'saca', v_ns, 'pagos_movidos', v_nmov));
  return jsonb_build_object('ok', true, 'queda', v_nq, 'pagos_movidos', v_nmov);
end $$;

create or replace function public.club_finanzas(p_anio int default null, p_mes int default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_anio int; v_mes int; v_pa int; v_pm int;
  v_kpis jsonb; v_deu jsonb; v_deu_ant jsonb; v_gru jsonb;
  v_altas jsonb; v_bajas jsonb; v_hist jsonb;
begin
  if not (public.is_admin() or public.is_direccion()) then raise exception 'No autorizado.'; end if;
  v_anio := coalesce(p_anio, extract(year from current_date)::int);
  v_mes := coalesce(p_mes, extract(month from current_date)::int);
  if v_mes = 1 then v_pm := 12; v_pa := v_anio - 1; else v_pm := v_mes - 1; v_pa := v_anio; end if;

  select jsonb_build_object(
    'activos', count(*) filter (where s.activo),
    'inactivos', count(*) filter (where not s.activo),
    'cuota_mes', coalesce(sum(coalesce(g.cuota,0)) filter (where s.activo), 0),
    'cobrado_mes', coalesce(sum((select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes)) filter (where s.activo), 0),
    'deudores', count(*) filter (where s.activo and coalesce(g.cuota,0) > 0
        and greatest(coalesce(g.cuota,0) - (select coalesce(sum(pa.monto),0) from public.club_payments pa
          where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes), 0) > 0),
    'al_dia', count(*) filter (where s.activo and coalesce(g.cuota,0) > 0
        and (select coalesce(sum(pa.monto),0) from public.club_payments pa
          where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes) >= coalesce(g.cuota,0))
  ) into v_kpis
  from public.club_students s left join public.club_groups g on g.id = s.group_id;

  select coalesce(jsonb_agg(x order by (x->>'saldo')::numeric desc), '[]'::jsonb) into v_deu
  from (
    select jsonb_build_object('id', s.id, 'nombre', s.nombre, 'grupo', g.nombre,
      'telefono', r.telefono, 'tutor', r.tutor, 'cuota', coalesce(g.cuota,0),
      'pagado', (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes),
      'saldo', greatest(coalesce(g.cuota,0) - (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes), 0),
      'ultimo_pago', (select to_char(pa.fecha,'DD/MM/YYYY') from public.club_payments pa
        where pa.student_id = s.id order by pa.fecha desc, pa.created_at desc limit 1)) as x
    from public.club_students s
    left join public.club_groups g on g.id = s.group_id
    left join public.club_requests r on r.id = s.request_id
    where s.activo and coalesce(g.cuota,0) > 0
      and greatest(coalesce(g.cuota,0) - (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_anio and pa.mes = v_mes), 0) > 0
  ) q;

  select coalesce(jsonb_agg(x order by (x->>'saldo')::numeric desc), '[]'::jsonb) into v_deu_ant
  from (
    select jsonb_build_object('id', s.id, 'nombre', s.nombre, 'grupo', g.nombre, 'activo', s.activo,
      'telefono', r.telefono, 'tutor', r.tutor, 'cuota', coalesce(g.cuota,0),
      'pagado', (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_pa and pa.mes = v_pm),
      'saldo', greatest(coalesce(g.cuota,0) - (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_pa and pa.mes = v_pm), 0)) as x
    from public.club_students s
    left join public.club_groups g on g.id = s.group_id
    left join public.club_requests r on r.id = s.request_id
    where coalesce(g.cuota,0) > 0
      and greatest(coalesce(g.cuota,0) - (select coalesce(sum(pa.monto),0) from public.club_payments pa
        where pa.student_id = s.id and pa.anio = v_pa and pa.mes = v_pm), 0) > 0
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object('grupo', g.nombre,
      'activos', (select count(*) from public.club_students s where s.group_id = g.id and s.activo),
      'cuota', coalesce(g.cuota,0),
      'cobrado', coalesce((select sum(pa.monto) from public.club_payments pa
        join public.club_students s on s.id = pa.student_id
        where s.group_id = g.id and pa.anio = v_anio and pa.mes = v_mes), 0)
    ) order by g.edad_min nulls last), '[]'::jsonb) into v_gru
  from public.club_groups g;

  select coalesce(jsonb_agg(jsonb_build_object('nombre', s.nombre, 'grupo', g.nombre,
      'fecha', to_char(s.created_at at time zone 'America/Asuncion','DD/MM/YYYY'))
    order by s.created_at desc), '[]'::jsonb) into v_altas
  from public.club_students s left join public.club_groups g on g.id = s.group_id
  where extract(year from s.created_at) = v_anio and extract(month from s.created_at) = v_mes;

  select coalesce(jsonb_agg(jsonb_build_object('nombre', a.detalle->>'nombre',
      'fecha', to_char(a.created_at at time zone 'America/Asuncion','DD/MM/YYYY'))
    order by a.created_at desc), '[]'::jsonb) into v_bajas
  from public.audit_log a
  where a.accion = 'club_alumno_quitar'
    and extract(year from a.created_at) = v_anio and extract(month from a.created_at) = v_mes;

  select coalesce(jsonb_agg(jsonb_build_object('anio', y, 'mes', m,
      'cobrado', cob, 'abonos', n) order by y, m), '[]'::jsonb) into v_hist
  from (
    select extract(year from dd.d)::int as y, extract(month from dd.d)::int as m
    from (select ((date_trunc('month', current_date) - (g.i || ' months')::interval)::date) as d
          from generate_series(0,5) g(i)) dd
  ) ym
  left join lateral (
    select coalesce(sum(monto),0) as cob, count(*) as n from public.club_payments
    where anio = ym.y and mes = ym.m
  ) t on true;

  return jsonb_build_object('anio', v_anio, 'mes', v_mes,
    'mes_ant', jsonb_build_object('anio', v_pa, 'mes', v_pm),
    'kpis', v_kpis, 'deudores_actual', v_deu, 'deudores_anterior', v_deu_ant,
    'por_grupo', v_gru, 'altas', v_altas, 'bajas', v_bajas, 'hist', v_hist);
end $$;
