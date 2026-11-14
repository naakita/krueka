-- Club Krueka: lectura privada de publicaciones aprobadas para alumnos con sesión válida.
-- No expone nombres, códigos, grupos, conversaciones ni archivos en borrador.
create or replace function public.club_krueka_galeria(p_student uuid, p_device text)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare v_inst uuid; v_result jsonb;
begin
 if not public.club_crea_estudiante_valido(p_student,p_device) then
   raise exception 'Entrá al Club Krueka con tu código personal.';
 end if;
 select institution_id into v_inst from public.club_students
 where id=p_student and activo;
 select coalesce(jsonb_agg(g.item order by g.approved_at desc),'[]'::jsonb) into v_result
 from (
   select p.published_at as approved_at,
     jsonb_build_object(
       'id',p.id,
       'title',left(p.title,80),
       'category',case
         when lower(coalesce(p.content#>>'{studio,files,tipo-club.txt}','')) in
           ('juegos','blogs','historietas','cuentos','dramas','animes','flyers','dibujos','animaciones','videos')
           then lower(p.content#>>'{studio,files,tipo-club.txt}')
         when p.type='design' then 'dibujos'
         when coalesce(p.content#>>'{studio,files,game-config.js}','') like '%"video-edit"%'
           then 'videos'
         when coalesce(p.content#>>'{studio,files,game-config.js}','') like '%"animation"%'
           then 'animaciones'
         else 'juegos'
       end,
       'published_at',p.published_at
     ) as item
   from public.club_creator_projects p
   where p.institution_id=v_inst and p.status='published'
     and p.type='web' and jsonb_typeof(p.content#>'{studio,files}')='object'
     and p.content#>>'{studio,files,index.html}' is not null
   order by p.published_at desc limit 80
 ) g;
 return coalesce(v_result,'[]'::jsonb);
end;$$;

create or replace function public.club_krueka_obra(p_student uuid,p_device text,p_project uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare v_inst uuid; v_result jsonb;
begin
 if not public.club_crea_estudiante_valido(p_student,p_device) then
   raise exception 'Tu sesión del Club venció. Volvé a ingresar.';
 end if;
 select institution_id into v_inst from public.club_students where id=p_student and activo;
 select jsonb_build_object('id',p.id,'title',left(p.title,80),
   'files',p.content#>'{studio,files}')
 into v_result
 from public.club_creator_projects p
 where p.id=p_project and p.institution_id=v_inst and p.status='published'
   and p.type='web' and jsonb_typeof(p.content#>'{studio,files}')='object'
   and p.content#>>'{studio,files,index.html}' is not null;
 if v_result is null then raise exception 'Esta publicación no está disponible.'; end if;
 return v_result;
end;$$;

revoke all on function public.club_krueka_galeria(uuid,text) from public;
revoke all on function public.club_krueka_obra(uuid,text,uuid) from public;
grant execute on function public.club_krueka_galeria(uuid,text) to anon,authenticated;
grant execute on function public.club_krueka_obra(uuid,text,uuid) to anon,authenticated;