-- Instalación idempotente del gestor de Academia Krueka, 06/11/2026.
-- Primera instalación efectuada mediante migraciones Supabase:
--   academia_access_codes_courses_20261106
--   fix_academia_student_token_concat_20261106
-- No colocar nombres de alumnos, códigos de acceso ni claves secretas en este archivo.
-- Las cuentas estudiantiles son independientes de club_students y de sus códigos heredados.
create table if not exists public.academia_students(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 3 and 100),
 code_hash text not null unique check(char_length(code_hash)=64),
 active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.academia_courses(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 slug text,title text not null check(char_length(title) between 4 and 120),
 summary text not null default '',
 kind text not null default 'custom' check(kind in ('intro','custom')),
 lessons jsonb not null default '[]'::jsonb check(jsonb_typeof(lessons)='array'),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 unique(owner_id,slug));
create table if not exists public.academia_enrollments(
 student_id uuid not null references public.academia_students(id) on delete cascade,
 course_id uuid not null references public.academia_courses(id) on delete cascade,
 active boolean not null default true,created_at timestamptz not null default now(),
 primary key(student_id,course_id));
create table if not exists public.academia_sessions(
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.academia_students(id) on delete cascade,
 token_hash text not null unique,expires_at timestamptz not null default now()+interval '12 hours',
 revoked boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.academia_login_attempts(
 id bigint generated always as identity primary key,
 device_hash text not null,success boolean not null default false,
 created_at timestamptz not null default now());
create index if not exists academia_attempts_device_recent on public.academia_login_attempts(device_hash,created_at desc);
create table if not exists public.academia_progress(
 student_id uuid not null references public.academia_students(id) on delete cascade,
 course_id uuid not null references public.academia_courses(id) on delete cascade,
 state jsonb not null default '{"version":1,"entries":{}}'::jsonb check(jsonb_typeof(state)='object'),
 updated_at timestamptz not null default now(),primary key(student_id,course_id));
alter table public.academia_students enable row level security;
alter table public.academia_courses enable row level security;
alter table public.academia_enrollments enable row level security;
alter table public.academia_sessions enable row level security;
alter table public.academia_login_attempts enable row level security;
alter table public.academia_progress enable row level security;
revoke all on public.academia_students,public.academia_courses,public.academia_enrollments,
 public.academia_sessions,public.academia_login_attempts,public.academia_progress from public,anon,authenticated;
revoke all on sequence public.academia_login_attempts_id_seq from public,anon,authenticated;

CREATE OR REPLACE FUNCTION public.academia_student_courses(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_student uuid;v_name text;v_courses jsonb;
begin
 if p_token is null or p_token !~ '^ac-[a-f0-9]{64}$'
 then return jsonb_build_object('ok',false,'error','Ingresá nuevamente con tu código.'); end if;
 select s.student_id into v_student from public.academia_sessions s
 join public.academia_students a on a.id=s.student_id and a.active
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
 and not s.revoked and s.expires_at>now() limit 1;
 if v_student is null then return jsonb_build_object('ok',false,'error','Tu sesión terminó. Volvé a ingresar.'); end if;
 select a.name into v_name from public.academia_students a where a.id=v_student;
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'summary',c.summary,
 'kind',c.kind,'lessons',c.lessons) order by c.title),'[]'::jsonb) into v_courses
 from public.academia_enrollments e join public.academia_courses c on c.id=e.course_id
 where e.student_id=v_student and e.active and c.published;
 return jsonb_build_object('ok',true,'student',jsonb_build_object('id',v_student,'name',v_name),'courses',v_courses);
end;
$function$;

CREATE OR REPLACE FUNCTION public.academia_student_login(p_code text, p_device text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_student record; v_hash text; v_device text;
 v_token text; v_fails integer;
begin
 if p_code is null or upper(trim(p_code)) !~ '^[A-F0-9]{10}$'
 then return jsonb_build_object('ok',false,'error','Código inválido. Revisalo con tu docente.'); end if;
 if p_device is null or char_length(p_device) not between 8 and 120
 then return jsonb_build_object('ok',false,'error','Actualizá la página e intentá nuevamente.'); end if;
 v_device=encode(extensions.digest(p_device,'sha256'),'hex');
 select count(*) into v_fails from public.academia_login_attempts
 where device_hash=v_device and not success and created_at>now()-interval '10 minutes';
 if v_fails>=12 then return jsonb_build_object('ok',false,'error','Demasiados intentos. Probá nuevamente más tarde.'); end if;
 v_hash=encode(extensions.digest(upper(trim(p_code)),'sha256'),'hex');
 select id,name,owner_id into v_student from public.academia_students
 where code_hash=v_hash and active limit 1;
 insert into public.academia_login_attempts(device_hash,success) values(v_device,v_student.id is not null);
 if v_student.id is null then return jsonb_build_object('ok',false,'error','Código no reconocido. Consultá a tu docente.'); end if;
 v_token='ac-'||encode(extensions.gen_random_bytes(32),'hex');
 update public.academia_sessions set revoked=true where student_id=v_student.id and not revoked;
 insert into public.academia_sessions(student_id,token_hash)
 values(v_student.id,encode(extensions.digest(v_token,'sha256'),'hex'));
 return jsonb_build_object('ok',true,'token',v_token,'student',jsonb_build_object('id',v_student.id,'name',v_student.name),'expiresAt',(now()+interval '12 hours'));
end;
$function$;

CREATE OR REPLACE FUNCTION public.academia_student_logout(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if p_token is null or p_token !~ '^ac-[a-f0-9]{64}$'
 then return jsonb_build_object('ok',true); end if;
 update public.academia_sessions set revoked=true
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 return jsonb_build_object('ok',true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.academia_student_progress(p_token text, p_course uuid, p_data jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_student uuid;v_saved jsonb;
begin
 if p_token is null or p_token !~ '^ac-[a-f0-9]{64}$'
 then return jsonb_build_object('ok',false,'error','Ingresá nuevamente con tu código.'); end if;
 select s.student_id into v_student from public.academia_sessions s
 join public.academia_students a on a.id=s.student_id and a.active
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
 and not s.revoked and s.expires_at>now() limit 1;
 if v_student is null then return jsonb_build_object('ok',false,'error','Tu sesión terminó. Volvé a ingresar.'); end if;
 if not exists(select 1 from public.academia_enrollments e join public.academia_courses c on c.id=e.course_id
 where e.student_id=v_student and e.course_id=p_course and e.active and c.published)
 then return jsonb_build_object('ok',false,'error','Este curso todavía no está habilitado para vos.'); end if;
 if p_data is not null then
   if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>26000
      or jsonb_typeof(p_data->'entries')<>'object'
   then return jsonb_build_object('ok',false,'error','El progreso tiene formato inválido.'); end if;
   insert into public.academia_progress(student_id,course_id,state)
     values(v_student,p_course,p_data)
     on conflict(student_id,course_id) do update set state=excluded.state,updated_at=now();
 end if;
 select state into v_saved from public.academia_progress where student_id=v_student and course_id=p_course;
 return jsonb_build_object('ok',true,'data',coalesce(v_saved,'{"version":1,"entries":{}}'::jsonb));
end;
$function$;

CREATE OR REPLACE FUNCTION public.academia_teacher_manage(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_owner uuid:=auth.uid(); v_name text; v_title text; v_summary text; v_code text;
 v_id uuid; v_sid uuid; v_cid uuid; v_ok boolean; v_publish boolean;
 v_lessons jsonb; v_students jsonb; v_courses jsonb; v_attempt integer;
begin
 if v_owner is null or not exists
   (select 1 from public.profiles p where p.id=v_owner and p.activo and p.role::text in ('admin','docente'))
 then return jsonb_build_object('ok',false,'error','Se requiere una cuenta docente habilitada.'); end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object'
 then return jsonb_build_object('ok',false,'error','Solicitud inválida.'); end if;

 if p_action='dashboard' then
   insert into public.academia_courses(owner_id,slug,title,summary,kind,lessons,published)
   values(v_owner,'intro-ia','Introducción a la IA y prompts',
   'Seis misiones: comprender la IA, escribir prompts precisos y comprobar resultados.',
   'intro','[]'::jsonb,true)
   on conflict(owner_id,slug) do nothing;
   select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'active',s.active,
      'enrollments',coalesce((select jsonb_agg(e.course_id) from public.academia_enrollments e where e.student_id=s.id and e.active),'[]'::jsonb))
      order by s.name),'[]'::jsonb) into v_students
   from public.academia_students s where s.owner_id=v_owner;
   select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'summary',c.summary,
       'kind',c.kind,'published',c.published,'lessons',c.lessons) order by c.created_at,c.title),'[]'::jsonb)
     into v_courses from public.academia_courses c where c.owner_id=v_owner;
   return jsonb_build_object('ok',true,'students',v_students,'courses',v_courses);
 elsif p_action='student_add' then
   v_name=trim(coalesce(p_payload->>'name',''));
   if char_length(v_name) not between 3 and 100 then return jsonb_build_object('ok',false,'error','Escribí un nombre entre 3 y 100 caracteres.'); end if;
   if (select count(*) from public.academia_students where owner_id=v_owner)>=300
   then return jsonb_build_object('ok',false,'error','Se alcanzó el límite de 300 alumnos.'); end if;
   for v_attempt in 1..10 loop
     v_code=upper(encode(extensions.gen_random_bytes(5),'hex'));
     insert into public.academia_students(owner_id,name,code_hash)
       values(v_owner,v_name,encode(extensions.digest(v_code,'sha256'),'hex'))
       on conflict(code_hash) do nothing returning id into v_id;
     exit when v_id is not null;
   end loop;
   if v_id is null then return jsonb_build_object('ok',false,'error','No fue posible generar un código único.'); end if;
   return jsonb_build_object('ok',true,'student_id',v_id,'code',v_code);
 elsif p_action='student_code_reset' then
   v_sid=nullif(p_payload->>'student_id','')::uuid;
   if not exists(select 1 from public.academia_students where id=v_sid and owner_id=v_owner)
   then return jsonb_build_object('ok',false,'error','Alumno no encontrado.'); end if;
   for v_attempt in 1..10 loop
     v_code=upper(encode(extensions.gen_random_bytes(5),'hex'));
     begin
       update public.academia_students set code_hash=encode(extensions.digest(v_code,'sha256'),'hex')
       where id=v_sid and owner_id=v_owner;
       exit;
     exception when unique_violation then null;
     end;
   end loop;
   if v_attempt=10 then return jsonb_build_object('ok',false,'error','No se pudo renovar el código.'); end if;
   update public.academia_sessions set revoked=true where student_id=v_sid;
   return jsonb_build_object('ok',true,'code',v_code,'student_id',v_sid);
 elsif p_action='student_active' then
   v_sid=nullif(p_payload->>'student_id','')::uuid;
   v_ok=coalesce((p_payload->>'active')::boolean,false);
   update public.academia_students set active=v_ok where id=v_sid and owner_id=v_owner;
   if not found then return jsonb_build_object('ok',false,'error','Alumno no encontrado.'); end if;
   if not v_ok then update public.academia_sessions set revoked=true where student_id=v_sid; end if;
   return jsonb_build_object('ok',true);
 elsif p_action='student_rename' then
   v_sid=nullif(p_payload->>'student_id','')::uuid;v_name=trim(coalesce(p_payload->>'name',''));
   if char_length(v_name) not between 3 and 100 then return jsonb_build_object('ok',false,'error','Nombre inválido.'); end if;
   update public.academia_students set name=v_name where id=v_sid and owner_id=v_owner;
   if not found then return jsonb_build_object('ok',false,'error','Alumno no encontrado.'); end if;
   return jsonb_build_object('ok',true);
 elsif p_action='course_add' then
   v_title=trim(coalesce(p_payload->>'title',''));
   v_summary=trim(coalesce(p_payload->>'summary',''));
   v_lessons=p_payload->'lessons';
   if char_length(v_title) not between 4 and 120 or char_length(v_summary)>600
   then return jsonb_build_object('ok',false,'error','Título o descripción fuera de límite.'); end if;
   if v_lessons is null or jsonb_typeof(v_lessons)<>'array' or jsonb_array_length(v_lessons) not between 1 and 12
   then return jsonb_build_object('ok',false,'error','Agregá entre 1 y 12 lecciones.'); end if;
   select bool_and(jsonb_typeof(x)='object' and
     char_length(coalesce(x->>'title','')) between 4 and 100 and
     char_length(coalesce(x->>'theory','')) between 30 and 3000 and
     char_length(coalesce(x->>'task','')) between 10 and 1400)
   into v_ok from jsonb_array_elements(v_lessons) x;
   if not coalesce(v_ok,false) then return jsonb_build_object('ok',false,'error','Cada lección debe incluir título, explicación y actividad válidos.'); end if;
   if (select count(*) from public.academia_courses where owner_id=v_owner)>=70
   then return jsonb_build_object('ok',false,'error','Límite de 70 cursos por docente.'); end if;
   insert into public.academia_courses(owner_id,title,summary,kind,lessons,published)
   values(v_owner,v_title,v_summary,'custom',v_lessons,false) returning id into v_id;
   return jsonb_build_object('ok',true,'course_id',v_id);
 elsif p_action='course_publish' then
   v_cid=nullif(p_payload->>'course_id','')::uuid;
   v_publish=coalesce((p_payload->>'published')::boolean,false);
   update public.academia_courses set published=v_publish where id=v_cid and owner_id=v_owner;
   if not found then return jsonb_build_object('ok',false,'error','Curso no encontrado.'); end if;
   return jsonb_build_object('ok',true);
 elsif p_action='assign' then
   v_sid=nullif(p_payload->>'student_id','')::uuid;
   v_cid=nullif(p_payload->>'course_id','')::uuid;
   if not exists(select 1 from public.academia_students where id=v_sid and owner_id=v_owner)
    or not exists(select 1 from public.academia_courses where id=v_cid and owner_id=v_owner)
   then return jsonb_build_object('ok',false,'error','Alumno o curso no pertenece al docente.'); end if;
   v_ok=coalesce((p_payload->>'active')::boolean,false);
   insert into public.academia_enrollments(student_id,course_id,active)
   values(v_sid,v_cid,v_ok) on conflict(student_id,course_id) do update set active=excluded.active;
   return jsonb_build_object('ok',true);
 else
   return jsonb_build_object('ok',false,'error','Acción desconocida.');
 end if;
exception when invalid_text_representation then
 return jsonb_build_object('ok',false,'error','Identificador inválido.');
end;
$function$;

revoke all on function public.academia_teacher_manage(text,jsonb) from public,anon,authenticated;
grant execute on function public.academia_teacher_manage(text,jsonb) to authenticated;
revoke all on function public.academia_student_login(text,text) from public,anon,authenticated;
grant execute on function public.academia_student_login(text,text) to anon,authenticated;
revoke all on function public.academia_student_courses(text) from public,anon,authenticated;
grant execute on function public.academia_student_courses(text) to anon,authenticated;
revoke all on function public.academia_student_progress(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.academia_student_progress(text,uuid,jsonb) to anon,authenticated;
revoke all on function public.academia_student_logout(text) from public,anon,authenticated;
grant execute on function public.academia_student_logout(text) to anon,authenticated;
