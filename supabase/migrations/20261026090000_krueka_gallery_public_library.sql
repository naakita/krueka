-- Galería Krueka: imágenes públicas aprobadas; carga autenticada para docentes/admin.
-- Ejecutado en Supabase el 26/10/2026; conservar esta migración para instalaciones nuevas.
create table if not exists public.krueka_gallery_images (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 3 and 90),
 category text not null check(category in
 ('Medio ambiente','Tecnología','Paisajes','Historia','Geografía','Ciencias','Paraguay','Animales')),
 description text not null default '' check(char_length(description)<=260),
 object_path text not null unique check(char_length(object_path)<260),
 submitted_by uuid references auth.users(id) on delete set null,
 published boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.krueka_gallery_images enable row level security;
drop policy if exists gallery_read_public_and_self on public.krueka_gallery_images;
create policy gallery_read_public_and_self on public.krueka_gallery_images
 for select to anon,authenticated using (
 published or submitted_by=(select auth.uid()) or
 exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text='admin')
);
drop policy if exists gallery_staff_suggest on public.krueka_gallery_images;
create policy gallery_staff_suggest on public.krueka_gallery_images
 for insert to authenticated with check (
 submitted_by=(select auth.uid()) and published=false and
 split_part(object_path,'/',1)=(select auth.uid())::text and
 exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text in ('admin','docente'))
);
drop policy if exists gallery_admin_review on public.krueka_gallery_images;
create policy gallery_admin_review on public.krueka_gallery_images
 for update to authenticated using (
 exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text='admin')
 ) with check (
 exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text='admin')
);
drop policy if exists gallery_delete_draft_or_admin on public.krueka_gallery_images;
create policy gallery_delete_draft_or_admin on public.krueka_gallery_images
 for delete to authenticated using (
 (not published and submitted_by=(select auth.uid())) or
 exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text='admin')
);
grant select on public.krueka_gallery_images to anon,authenticated;
grant insert,update,delete on public.krueka_gallery_images to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('krueka-gallery','krueka-gallery',true,2097152,
 array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
drop policy if exists gallery_storage_staff_insert on storage.objects;
create policy gallery_storage_staff_insert on storage.objects
 for insert to authenticated with check (
 bucket_id='krueka-gallery' and
 (storage.foldername(name))[1]=(select auth.uid())::text and
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text in ('admin','docente'))
);
drop policy if exists gallery_storage_staff_delete on storage.objects;
create policy gallery_storage_staff_delete on storage.objects
 for delete to authenticated using (
 bucket_id='krueka-gallery' and (
 (storage.foldername(name))[1]=(select auth.uid())::text or
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo and p.role::text='admin')
 ));
-- Precaución: el bucket es público; subir solo materiales aptos para publicación.
