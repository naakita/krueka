-- Ajustar el límite público para aulas que comparten una sola dirección IP.
-- Se mantiene el límite global para proteger el almacenamiento escolar.
create or replace function public.word_dropbox_reserve(p_ip_hash text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_ip_hash,13));
 perform pg_advisory_xact_lock(117773111::bigint);
 if (select count(*) from public.word_dropbox_request_limits where ip_hash=p_ip_hash and created_at>now()-interval '1 hour')>=60 then return false; end if;
 if (select count(*) from public.word_dropbox_request_limits where created_at>now()-interval '24 hours')>=150 then return false; end if;
 insert into public.word_dropbox_request_limits(ip_hash) values(p_ip_hash);
 return true;
end; $$;
revoke all on function public.word_dropbox_reserve(text) from public, anon, authenticated;
grant execute on function public.word_dropbox_reserve(text) to service_role;