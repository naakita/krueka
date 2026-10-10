-- Pausa compartida del proveedor: sólo categorías de error, sin claves ni pedidos.
create table public.club_studio_ai_provider (
 id boolean primary key default true check (id),
 reason text not null check (reason in ('provider_credit_balance','provider_spend_limit','provider_usage_limit','provider_quota','provider_rate_limit','provider_limit')),
 paused_until timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.club_studio_ai_provider enable row level security;
revoke all on public.club_studio_ai_provider from public,anon,authenticated,service_role;
grant select,insert,update on public.club_studio_ai_provider to service_role;
