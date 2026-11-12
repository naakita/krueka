-- Archivos múltiples para actividades temporales: tabla privada y compatibilidad con PDF anteriores.
create table if not exists public.krueka_live_materials (
 id uuid primary key default gen_random_uuid(),
 activity_id uuid not null references public.krueka_live_activities(id) on delete cascade,
 file_name text not null check(char_length(file_name) between 1 and 175),
 object_path text not null unique check(object_path ~ '^(materials|guides)/[0-9a-f-]{36}/[0-9a-f-]{36}[.][a-z0-9]+$'),
 mime_type text not null,
 size_bytes integer check(size_bytes is null or (size_bytes between 1 and 10485760)),
 uploaded_at timestamptz not null default now()
);
create index if not exists krueka_live_materials_activity_idx
 on public.krueka_live_materials(activity_id,uploaded_at,id);
alter table public.krueka_live_materials enable row level security;
revoke all on public.krueka_live_materials from public,anon,authenticated;

-- Registrar cada PDF que ya estaba publicado sin moverlo ni destruirlo.
insert into public.krueka_live_materials(activity_id,file_name,object_path,mime_type,size_bytes)
select id,pdf_name,pdf_path,'application/pdf',null
from public.krueka_live_activities
where pdf_path is not null and pdf_name is not null
on conflict(object_path) do nothing;

-- Ampliación explícita de materiales seguros, sin habilitar ejecutables ni scripts.
update storage.buckets set
 public=false, file_size_limit=10485760,
 allowed_mime_types=array[
 'application/pdf',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 'application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint',
 'application/vnd.oasis.opendocument.text',
 'application/vnd.oasis.opendocument.spreadsheet',
 'application/vnd.oasis.opendocument.presentation',
 'text/plain','text/csv','application/rtf',
 'image/jpeg','image/png','image/webp','image/gif','application/zip'
 ]::text[]
where id='krueka-actividades-clase';
