-- Buzones de Excel aislados por grado: servicio de alumnos de sólo subida y revisión docente.
create table if not exists public.excel_grade_groups(
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  accepting boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.excel_grade_submissions(
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.excel_grade_groups(id),
  student_name text not null check (char_length(student_name) between 3 and 90),
  assignment text not null check (char_length(assignment) between 2 and 120),
  original_filename text not null check (char_length(original_filename) between 5 and 180),
  object_path text not null unique,
  size_bytes integer not null check (size_bytes between 150 and 10485760),
  status text not null default 'pendiente' check(status in ('pendiente','revisado','corregir')),
  teacher_note text not null default '' check(char_length(teacher_note)<=1000),
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists excel_grades_submissions_idx on public.excel_grade_submissions(group_id, uploaded_at desc);
create table if not exists public.excel_grade_upload_log(
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  group_id uuid not null references public.excel_grade_groups(id),
  created_at timestamptz not null default now()
);
create index if not exists excel_uploads_ip_idx on public.excel_grade_upload_log(ip_hash,created_at desc);
create index if not exists excel_uploads_time_idx on public.excel_grade_upload_log(created_at desc);
alter table public.excel_grade_groups enable row level security;
alter table public.excel_grade_submissions enable row level security;
alter table public.excel_grade_upload_log enable row level security;
revoke all on public.excel_grade_groups, public.excel_grade_submissions, public.excel_grade_upload_log from public,anon,authenticated;
revoke all on sequence public.excel_grade_upload_log_id_seq from public,anon,authenticated;
create or replace function public.excel_grade_reserve(p_ip_hash text,p_group_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' or p_group_id is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash,81));
  perform pg_advisory_xact_lock(238812090::bigint);
  if (select count(*) from public.excel_grade_upload_log where ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=90 then return false; end if;
  if (select count(*) from public.excel_grade_upload_log where group_id=p_group_id and created_at>now()-interval '1 hour')>=140 then return false; end if;
  if (select count(*) from public.excel_grade_upload_log where created_at>now()-interval '24 hours')>=800 then return false; end if;
  insert into public.excel_grade_upload_log(ip_hash,group_id) values(p_ip_hash,p_group_id);
  return true;
end; $$;
revoke all on function public.excel_grade_reserve(text,uuid) from public,anon,authenticated;
grant execute on function public.excel_grade_reserve(text,uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('krueka-excel-por-grado','krueka-excel-por-grado',false,10485760,
array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;