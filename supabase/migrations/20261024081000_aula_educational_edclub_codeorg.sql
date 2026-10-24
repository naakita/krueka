-- Dominios educativos aprobados para BEI: EdClub y Code.org.
-- Idempotente y conserva cualquier dominio previamente autorizado.
update public.aula_devices d
set allowed=(
 select jsonb_agg(to_jsonb(x.domain) order by x.domain)
 from (select distinct jsonb_array_elements_text(
  coalesce(d.allowed,'[]'::jsonb) || '["betesda-educacion.edclub.com","static.typingclub.com","fonts.googleapis.com","fonts.gstatic.com","edclub.com","www.edclub.com","school.edclub.com","edclub.app","edclub.dev","typingclub.com","www.typingclub.com","code.org","www.code.org","studio.code.org","videos.code.org","contentful-videos.code.org","codeprojects.org","downloads.computinginthecore.org","codeaiprojects.org","www.codeaiprojects.org","api.pusherapp.com","ws.pusherapp.com"]'::jsonb
 ) as domain) x
)
where lower(d.label) like '%bei%';
-- No se modifica "enabled", el quiosco ni los tokens.
