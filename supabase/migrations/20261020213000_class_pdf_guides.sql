-- Guías PDF privadas vinculadas a códigos temporales de clase.
-- No se abren permisos públicos ni se altera el flujo de entregas.
alter table public.krueka_live_activities
 add column if not exists pdf_path text,
 add column if not exists pdf_name text;
alter table public.krueka_live_activities
 drop constraint if exists krueka_live_pdf_consistent;
alter table public.krueka_live_activities
 add constraint krueka_live_pdf_consistent check (
  (pdf_path is null and pdf_name is null) or
  (pdf_path is not null and pdf_name is not null
   and char_length(pdf_name) between 5 and 175
   and pdf_path ~ '^guides/[0-9a-f-]{36}/[0-9a-f-]{36}\\.pdf$')
 );
