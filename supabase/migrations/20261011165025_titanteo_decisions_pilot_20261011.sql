-- Titanteo Decisions: tablas de piloto aisladas, sin tocar registros escolares.
create table if not exists public.titanteo_decisions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  context text not null check (context in ('comercio','educacion')),
  message text not null check (char_length(message) between 3 and 1600),
  category text not null check (category in ('ventas','soporte','facturacion','legal','academico','administracion','revision')),
  priority text not null check (priority in ('alta','media','normal')),
  explanation text not null check (char_length(explanation) between 1 and 500),
  rule_score smallint not null check (rule_score between 0 and 100),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence)='array'),
  origin text not null default 'manual' check (origin in ('manual','csv')),
  engine_version text not null default 'rules-v1',
  created_at timestamptz not null default now()
);
create index if not exists idx_titanteo_decisions_institution on public.titanteo_decisions(institution_id,created_at desc);
create index if not exists idx_titanteo_decisions_owner on public.titanteo_decisions(created_by,created_at desc);
alter table public.titanteo_decisions enable row level security;
revoke all on public.titanteo_decisions from anon,authenticated;
grant select,insert on public.titanteo_decisions to authenticated;
create policy titanteo_decisions_read on public.titanteo_decisions
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo
    and p.institution_id=titanteo_decisions.institution_id
    and p.role in ('docente','director','admin')
    and (titanteo_decisions.created_by=(select auth.uid()) or p.role in ('director','admin')))
);
create policy titanteo_decisions_insert on public.titanteo_decisions
for insert to authenticated with check (
  created_by=(select auth.uid()) and exists (
    select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo
    and p.institution_id=titanteo_decisions.institution_id
    and p.role in ('docente','director','admin'))
);
create table if not exists public.titanteo_decision_reviews (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.titanteo_decisions(id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references auth.users(id),
  verdict text not null check (verdict in ('confirmado','corregir')),
  correction_category text check (correction_category is null or correction_category in ('ventas','soporte','facturacion','legal','academico','administracion','revision')),
  note text check (char_length(note)<=350),
  created_at timestamptz not null default now(),
  constraint correction_required check (verdict<>'corregir' or correction_category is not null)
);
create index if not exists idx_titanteo_reviews_decision on public.titanteo_decision_reviews(decision_id,created_at desc);
alter table public.titanteo_decision_reviews enable row level security;
revoke all on public.titanteo_decision_reviews from anon,authenticated;
grant select,insert on public.titanteo_decision_reviews to authenticated;
create policy titanteo_reviews_read on public.titanteo_decision_reviews
for select to authenticated using (
  exists (select 1 from public.titanteo_decisions d where d.id=titanteo_decision_reviews.decision_id)
);
create policy titanteo_reviews_insert on public.titanteo_decision_reviews
for insert to authenticated with check (
  reviewer_id=(select auth.uid()) and exists (
    select 1 from public.titanteo_decisions d where d.id=titanteo_decision_reviews.decision_id)
);
comment on table public.titanteo_decisions is 'Piloto Titanteo Decisions: sugerencias explicables sin acciones automaticas';
comment on table public.titanteo_decision_reviews is 'Revision humana append-only de clasificaciones';
