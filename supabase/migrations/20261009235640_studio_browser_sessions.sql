-- Acceso privado del Studio desde cualquier equipo con el código existente.
-- No cambia el acceso al Club ni libera equipos; conserva todas las RPC de proyectos.
create table public.club_studio_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.club_students(id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null,
  device_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '12 hours'),
  revoked boolean not null default false
);
create index club_studio_sessions_student on public.club_studio_sessions(student_id,expires_at);
alter table public.club_studio_sessions enable row level security;
revoke all on public.club_studio_sessions from public,anon,authenticated;

create table public.club_studio_login_attempts (
  id bigint generated always as identity primary key,
  device_hash text not null,
  created_at timestamptz not null default now()
);
create index club_studio_login_attempts_device on public.club_studio_login_attempts(device_hash,created_at);
create index club_studio_login_attempts_time on public.club_studio_login_attempts(created_at);
alter table public.club_studio_login_attempts enable row level security;
revoke all on public.club_studio_login_attempts from public,anon,authenticated;
revoke all on sequence public.club_studio_login_attempts_id_seq from public,anon,authenticated;

create or replace function public.club_studio_entrar(p_codigo text,p_device text,p_agent text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.club_students%rowtype;v_code text:=upper(btrim(coalesce(p_codigo,'')));
 v_device text;v_token text;v_level text;v_expiry timestamptz:=now()+interval '12 hours';
begin
 if v_code !~ '^[A-Z0-9]{6}$' or p_device is null or char_length(p_device) not between 8 and 120 then
  return jsonb_build_object('ok',false,'error','Escribí tu código personal completo.');
 end if;
 v_device:=encode(extensions.digest(p_device,'sha256'),'hex');
 -- Límite global serializado más límite por navegador. Nunca guarda códigos ni tokens.
 perform pg_advisory_xact_lock(72482921);
 if (select count(*) from public.club_studio_login_attempts where created_at>now()-interval '10 minutes')>=180 or
    (select count(*) from public.club_studio_login_attempts where device_hash=v_device and created_at>now()-interval '10 minutes')>=12 then
  return jsonb_build_object('ok',false,'error','Hubo muchos intentos. Esperá unos minutos y volvé a entrar.');
 end if;
 insert into public.club_studio_login_attempts(device_hash) values(v_device);
 select * into s from public.club_students where upper(codigo)=v_code and activo
  and institution_id='88c4af03-bdce-48e6-b548-b6904fe704bd'::uuid for update;
 if s.id is null then return jsonb_build_object('ok',false,'error','Ese código no pertenece a un alumno activo del Club.');end if;
 select coalesce(nivel,'peques') into v_level from public.club_groups where id=s.group_id;
 -- Una sesión del taller por alumno; un nuevo ingreso invalida el anterior.
 update public.club_studio_sessions set revoked=true where student_id=s.id and not revoked;
 v_token:='st-'||encode(extensions.gen_random_bytes(32),'hex');
 insert into public.club_studio_sessions(student_id,token_hash,code_hash,device_hash,expires_at)
 values(s.id,encode(extensions.digest(v_token,'sha256'),'hex'),encode(extensions.digest(s.codigo,'sha256'),'hex'),v_device,v_expiry);
 update public.club_students set ultimo_acceso=now() where id=s.id;
 insert into public.club_accesos(student_id,device_id,user_agent,sospechoso)
 values(s.id,left(p_device,120),left(coalesce(p_agent,''),500),false);
 delete from public.club_studio_login_attempts where created_at<now()-interval '1 day';
 delete from public.club_studio_sessions where expires_at<now()-interval '1 day';
 return jsonb_build_object('ok',true,'token',v_token,'expiresAt',v_expiry,'student',
  jsonb_build_object('student_id',s.id,'nombre',s.nombre,'avatar',s.avatar,'puntos',s.puntos,'nivel',coalesce(v_level,'peques')));
end;$$;
revoke all on function public.club_studio_entrar(text,text,text) from public;
grant execute on function public.club_studio_entrar(text,text,text) to anon,authenticated;

create or replace function public.club_studio_salir(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_token ~ '^st-[a-f0-9]{64}$' then
  update public.club_studio_sessions set revoked=true where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.club_studio_salir(text) from public;
grant execute on function public.club_studio_salir(text) to anon,authenticated;

create or replace function public.club_crea_estudiante_valido(p_student uuid,p_device text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.club_students s where s.id=p_student and s.activo
  and s.institution_id='88c4af03-bdce-48e6-b548-b6904fe704bd'::uuid
  and p_device is not null and char_length(p_device) between 8 and 120
  and (s.device_id=p_device or (
   p_device ~ '^st-[a-f0-9]{64}$' and exists(select 1 from public.club_studio_sessions sess
    where sess.student_id=s.id and not sess.revoked and sess.expires_at>now()
    and sess.code_hash=encode(extensions.digest(s.codigo,'sha256'),'hex')
    and sess.token_hash=encode(extensions.digest(p_device,'sha256'),'hex'))
  )));
$$;
