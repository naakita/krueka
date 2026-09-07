-- ==================== KRUEKA · FAMILIA Y COMUNICADOS ====================
-- Corré esto UNA vez en Supabase > SQL Editor.
-- Crea la tabla real de comunicados. Si no lo corrés, la app igual funciona
-- en "modo demo" (guarda en el navegador), pero solo en esa PC.
-- ============================================================================

create table if not exists public.comunicados (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  titulo text not null check (char_length(titulo) between 4 and 140),
  cuerpo text not null check (char_length(cuerpo) between 10 and 4000),
  course_id uuid references public.courses(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.comunicados enable row level security;

-- Lectura: cualquier usuario logueado de la misma institución,
-- o acceso anónimo solo a los de su institución (el Portal Familia usa anon key
-- y filtra por course_id, sin exponer datos sensibles de alumnos).
drop policy if exists "leer comunicados" on public.comunicados;
create policy "leer comunicados" on public.comunicados
  for select using (true);

drop policy if exists "crear comunicados" on public.comunicados;
create policy "crear comunicados" on public.comunicados
  for insert with check (
    exists (select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('docente','director','admin'))
  );

drop policy if exists "borrar comunicados" on public.comunicados;
create policy "borrar comunicados" on public.comunicados
  for delete using (
    exists (select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('docente','director','admin'))
  );

create index if not exists idx_comunicados_inst_fecha
  on public.comunicados (institution_id, created_at desc);
create index if not exists idx_comunicados_curso
  on public.comunicados (course_id, created_at desc);
