-- Contabilidad privada de IA. No guarda prompts ni código; solo reservas y consumo.
create table public.club_studio_ai_months (
  month date primary key,
  spent_micros bigint not null default 0 check (spent_micros >= 0),
  reserved_micros bigint not null default 0 check (reserved_micros >= 0)
);
create table public.club_studio_ai_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.club_students(id) on delete cascade,
  month date not null references public.club_studio_ai_months(month),
  model text not null check (model = 'gpt-6-luna'),
  reserved_micros bigint not null check (reserved_micros > 0),
  actual_micros bigint check (actual_micros >= 0),
  state text not null default 'reserved' check (state in ('reserved','settled','uncertain')),
  created_at timestamptz not null default now()
);
create index club_studio_ai_requests_student_created on public.club_studio_ai_requests(student_id,created_at);
create index club_studio_ai_requests_month on public.club_studio_ai_requests(month);
alter table public.club_studio_ai_months enable row level security;
alter table public.club_studio_ai_requests enable row level security;
revoke all on public.club_studio_ai_months, public.club_studio_ai_requests from public, anon, authenticated;
-- Todo acceso pasa por RPC exclusivas de service_role. Sin políticas públicas.

create function public.club_studio_ai_status(p_student uuid,p_device text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_month date:=date_trunc('month',now() at time zone 'America/Asuncion')::date;
 v_day timestamptz:=date_trunc('day',now() at time zone 'America/Asuncion') at time zone 'America/Asuncion';
 v_used integer;v_total bigint;
begin
 if not public.club_crea_estudiante_valido(p_student,p_device) then raise exception 'Dispositivo no autorizado.';end if;
 select count(*) into v_used from public.club_studio_ai_requests where student_id=p_student and created_at>=v_day;
 select spent_micros+reserved_micros into v_total from public.club_studio_ai_months where month=v_month;
 return jsonb_build_object('usedToday',v_used,'dailyLimit',12,'budgetAvailable',coalesce(v_total,0)<5000000);
end;$$;

create function public.club_studio_ai_reserve(p_student uuid,p_device text,p_micros bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_month date:=date_trunc('month',now() at time zone 'America/Asuncion')::date;
 v_day timestamptz:=date_trunc('day',now() at time zone 'America/Asuncion') at time zone 'America/Asuncion';
 v_row public.club_studio_ai_months%rowtype;v_count integer;v_id uuid;
begin
 if not public.club_crea_estudiante_valido(p_student,p_device) then raise exception 'Dispositivo no autorizado.';end if;
 if p_micros is null or p_micros not between 1 and 200000 then raise exception 'Reserva no válida.';end if;
 insert into public.club_studio_ai_months(month) values(v_month) on conflict do nothing;
 select * into v_row from public.club_studio_ai_months where month=v_month for update;
 -- Esta fila bloqueada serializa reservas: varios alumnos no pueden exceder el presupuesto.
 if v_row.spent_micros+v_row.reserved_micros+p_micros>5000000 then
  return jsonb_build_object('ok',false,'code','budget','error','El cupo mensual de IA terminó. Podés seguir creando con las bases y el código.');end if;
 select count(*) into v_count from public.club_studio_ai_requests where student_id=p_student and created_at>=v_day;
 if v_count>=12 then return jsonb_build_object('ok',false,'code','daily_limit','error','Usaste tus 12 pedidos de hoy. Seguí probando y editando tu juego.');end if;
 if exists(select 1 from public.club_studio_ai_requests where student_id=p_student and created_at>now()-interval '10 seconds') then
  return jsonb_build_object('ok',false,'code','cooldown','error','Esperá unos segundos antes de pedir otro cambio.');end if;
 if exists(select 1 from public.club_studio_ai_requests where student_id=p_student and state='reserved' and created_at>now()-interval '100 seconds') then
  return jsonb_build_object('ok',false,'code','busy','error','Ya hay un pedido tuyo en proceso. Esperá su respuesta.');end if;
 select count(*) into v_count from public.club_studio_ai_requests where state='reserved' and created_at>now()-interval '100 seconds';
 if v_count>=3 then return jsonb_build_object('ok',false,'code','busy','error','Tres compañeros están usando la IA. Esperá un momento y volvé a enviar.');end if;
 insert into public.club_studio_ai_requests(student_id,month,model,reserved_micros) values(p_student,v_month,'gpt-6-luna',p_micros) returning id into v_id;
 update public.club_studio_ai_months set reserved_micros=reserved_micros+p_micros where month=v_month;
 return jsonb_build_object('ok',true,'requestId',v_id,'usedToday',(select count(*) from public.club_studio_ai_requests where student_id=p_student and created_at>=v_day),'dailyLimit',12);
end;$$;

create function public.club_studio_ai_finish(p_request uuid,p_actual_micros bigint)
returns void language plpgsql security definer set search_path='' as $$
declare v_month date;v_row public.club_studio_ai_requests%rowtype;
begin
 select month into v_month from public.club_studio_ai_requests where id=p_request;
 if v_month is null then raise exception 'Reserva no encontrada.';end if;
 perform 1 from public.club_studio_ai_months where month=v_month for update;
 select * into v_row from public.club_studio_ai_requests where id=p_request for update;
 if v_row.state<>'reserved' then return;end if;
 if p_actual_micros is null then
  -- Tiempo agotado o respuesta sin uso: conservar el máximo reservado, sin reintentar.
  update public.club_studio_ai_requests set state='uncertain' where id=p_request;
 else
  if p_actual_micros<0 then raise exception 'Consumo no válido.';end if;
  update public.club_studio_ai_requests set state='settled',actual_micros=p_actual_micros where id=p_request;
  update public.club_studio_ai_months set reserved_micros=reserved_micros-v_row.reserved_micros,spent_micros=spent_micros+p_actual_micros where month=v_month;
 end if;
end;$$;
revoke all on function public.club_studio_ai_status(uuid,text),public.club_studio_ai_reserve(uuid,text,bigint),public.club_studio_ai_finish(uuid,bigint) from public,anon,authenticated;
grant execute on function public.club_studio_ai_status(uuid,text),public.club_studio_ai_reserve(uuid,text,bigint),public.club_studio_ai_finish(uuid,bigint) to service_role;
