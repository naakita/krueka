-- Krueka: clases temporales con consignas y entregas privadas (octubre 2026).
create table if not exists public.krueka_live_activities (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id),
 title text not null check (char_length(title) between 4 and 140),
 grade text not null check (char_length(grade) between 2 and 100),
 subject text not null check (char_length(subject) between 2 and 100),
 instructions text not null check (char_length(instructions) between 15 and 10000),
 code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
 accepting boolean not null default true,
 created_at timestamptz not null default now(),
 closed_at timestamptz,
 constraint krueka_live_closed_consistent check ((accepting and closed_at is null) or (not accepting and closed_at is not null))
);
create index if not exists krueka_live_owner_idx on public.krueka_live_activities (teacher_id, created_at desc);
create table if not exists public.krueka_live_submissions (
 id uuid primary key default gen_random_uuid(),
 activity_id uuid not null references public.krueka_live_activities(id),
 student_name text not null check (char_length(student_name) between 3 and 90),
 file_name text not null check (char_length(file_name) between 5 and 180),
 object_path text not null unique,
 mime_type text not null,
 size_bytes integer not null check(size_bytes between 100 and 10485760),
 status text not null default 'pendiente' check(status in ('pendiente','revisado','corregir')),
 teacher_note text not null default '' check(char_length(teacher_note) <= 1000),
 uploaded_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists krueka_live_sub_activity_idx on public.krueka_live_submissions (activity_id,uploaded_at desc);
create table if not exists public.krueka_live_upload_limiter (
 id bigint generated always as identity primary key,
 activity_id uuid not null references public.krueka_live_activities(id),
 ip_hash text not null check(ip_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now()
);
create index if not exists krueka_live_limit_ip on public.krueka_live_upload_limiter (ip_hash,created_at desc);
create index if not exists krueka_live_limit_activity on public.krueka_live_upload_limiter (activity_id,created_at desc);
alter table public.krueka_live_activities enable row level security;
alter table public.krueka_live_submissions enable row level security;
alter table public.krueka_live_upload_limiter enable row level security;
revoke all on public.krueka_live_activities,public.krueka_live_submissions,public.krueka_live_upload_limiter from public,anon,authenticated;
revoke all on sequence public.krueka_live_upload_limiter_id_seq from public,anon,authenticated;
-- An atomic reservation serializes close() against the initial upload permission check.
create or replace function public.krueka_live_reserve(p_activity_id uuid,p_code_hash text,p_ip_hash text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_open boolean;
begin
 if p_activity_id is null or p_code_hash !~ '^[0-9a-f]{64}$' or p_ip_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 select a.accepting into v_open from public.krueka_live_activities a
 where a.id=p_activity_id and a.code_hash=p_code_hash for update;
 if not coalesce(v_open,false) then return false; end if;
 perform pg_advisory_xact_lock(20261020::bigint);
 if (select count(*) from public.krueka_live_upload_limiter where ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=45 then return false; end if;
 if (select count(*) from public.krueka_live_upload_limiter where activity_id=p_activity_id and created_at>now()-interval '1 hour')>=130 then return false; end if;
 if (select count(*) from public.krueka_live_upload_limiter where created_at>now()-interval '24 hours')>=1200 then return false; end if;
 insert into public.krueka_live_upload_limiter(activity_id,ip_hash) values(p_activity_id,p_ip_hash);
 return true;
end;$$;
-- The final insert and the close operation lock the SAME class row.
-- A file finishing after closure is rejected and removed from storage by Edge Function.
create or replace function public.krueka_live_finalize(p_activity_id uuid,p_code_hash text,
 p_submission_id uuid,p_student text,p_filename text,p_object_path text,p_mime text,p_size integer)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_open boolean;
begin
 if p_activity_id is null or p_submission_id is null or p_code_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 select a.accepting into v_open from public.krueka_live_activities a
 where a.id=p_activity_id and a.code_hash=p_code_hash for update;
 if not coalesce(v_open,false) then return false; end if;
 insert into public.krueka_live_submissions(id,activity_id,student_name,file_name,object_path,mime_type,size_bytes)
 values(p_submission_id,p_activity_id,p_student,p_filename,p_object_path,p_mime,p_size);
 return true;
end;$$;
revoke all on function public.krueka_live_reserve(uuid,text,text) from public,anon,authenticated;
grant execute on function public.krueka_live_reserve(uuid,text,text) to service_role;
revoke all on function public.krueka_live_finalize(uuid,text,uuid,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.krueka_live_finalize(uuid,text,uuid,text,text,text,integer) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('krueka-actividades-clase','krueka-actividades-clase',false,10485760,
 array['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
       'application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;
