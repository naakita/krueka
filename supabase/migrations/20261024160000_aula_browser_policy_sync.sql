-- Versioned browser policy desired state for Krueka classroom PCs.
-- Existing aula-control device token is untouched. The policy worker has a separate secret.
alter table public.aula_devices
 add column if not exists policy_token_hash text,
 add column if not exists policy_version bigint not null default 1,
 add column if not exists policy_applied_version bigint not null default 0,
 add column if not exists policy_last_seen timestamptz,
 add column if not exists policy_applied_at timestamptz,
 add column if not exists policy_apply_error text;
create or replace function public.aula_browser_policy_version_bump()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.allowed is distinct from old.allowed or new.enabled is distinct from old.enabled then
  new.policy_version := old.policy_version + 1;
 end if;
 return new;
end $$;
drop trigger if exists aula_browser_policy_version_bump_trg on public.aula_devices;
create trigger aula_browser_policy_version_bump_trg
before update of allowed,enabled on public.aula_devices
for each row execute function public.aula_browser_policy_version_bump();
revoke all on function public.aula_browser_policy_version_bump() from public,anon,authenticated;
-- No new direct read policies or public grants; access stays through authenticated Edge Function.
