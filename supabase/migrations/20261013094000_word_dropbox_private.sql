-- Buzón público Word de Krueka: metadatos protegidos, límites y bucket privado.
create table if not exists public.word_dropbox_submissions (
 id uuid primary key default gen_random_uuid(),
 student_name text not null check (char_length(student_name) between 3 and 90),
 class_name text not null check (char_length(class_name) between 2 and 60),
 assignment text not null check (char_length(assignment) between 2 and 100),
 original_filename text not null check (char_length(original_filename) between 5 and 160),
 object_path text not null unique,
 size_bytes integer not null check (size_bytes between 1 and 5242880),
 review_status text not null default 'pendiente' check (review_status in ('pendiente','revisado','corregir')),
 teacher_note text not null default '' check (char_length(teacher_note)<=1000),
 uploaded_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create index if not exists word_dropbox_submissions_newest on public.word_dropbox_submissions(uploaded_at desc);
create index if not exists word_dropbox_submissions_class on public.word_dropbox_submissions(class_name,uploaded_at desc);
alter table public.word_dropbox_submissions enable row level security;
revoke all on public.word_dropbox_submissions from public, anon, authenticated;
create table if not exists public.word_dropbox_request_limits (
 id bigint generated always as identity primary key,
 ip_hash text not null check (char_length(ip_hash)=64),
 created_at timestamptz not null default now()
);
create index if not exists word_dropbox_request_limits_by_ip on public.word_dropbox_request_limits(ip_hash,created_at desc);
create index if not exists word_dropbox_request_limits_by_time on public.word_dropbox_request_limits(created_at desc);
alter table public.word_dropbox_request_limits enable row level security;
revoke all on public.word_dropbox_request_limits from public, anon, authenticated;
create or replace function public.word_dropbox_reserve(p_ip_hash text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_ip_hash,13));
 perform pg_advisory_xact_lock(117773111::bigint);
 if (select count(*) from public.word_dropbox_request_limits where ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=12 then return false; end if;
 if (select count(*) from public.word_dropbox_request_limits where created_at>now()-interval '24 hours')>=350 then return false; end if;
 insert into public.word_dropbox_request_limits(ip_hash) values(p_ip_hash);
 return true;
end; $$;
revoke all on function public.word_dropbox_reserve(text) from public, anon, authenticated;
grant execute on function public.word_dropbox_reserve(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('krueka-word-entregas','krueka-word-entregas',false,5242880,array['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;