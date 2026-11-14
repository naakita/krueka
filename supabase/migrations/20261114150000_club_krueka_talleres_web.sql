-- Clasifica los nuevos talleres sin cambiar el acceso ni la aprobación.
CREATE OR REPLACE FUNCTION public.club_krueka_galeria(p_student uuid, p_device text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
           ('juegos','paginas','aplicaciones','blogs','historietas','cuentos','dramas','animes','flyers','dibujos','animaciones','videos')
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
end;$function$;

CREATE OR REPLACE FUNCTION public.club_krueka_public_galeria()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(jsonb_agg(x.item order by x.published_at desc), '[]'::jsonb)
  from (
    select p.published_at,
      jsonb_build_object(
        'id', p.id,
        'title', left(p.title, 80),
        'category', case
          when lower(coalesce(p.content#>>'{studio,files,tipo-club.txt}', '')) in
          ('juegos','paginas','aplicaciones','blogs','historietas','cuentos','dramas','animes','flyers','dibujos','animaciones','videos')
          then lower(p.content#>>'{studio,files,tipo-club.txt}')
          when p.type = 'design' then 'dibujos'
          else 'juegos'
        end,
        'published_at', p.published_at
      ) as item
    from public.club_creator_projects p
    where p.institution_id = '88c4af03-bdce-48e6-b548-b6904fe704bd'::uuid
      and p.status = 'published'
      and p.type = 'web'
      and jsonb_typeof(p.content#>'{studio,files}') = 'object'
      and p.content#>>'{studio,files,index.html}' is not null
    order by p.published_at desc
    limit 80
  ) x;
$function$;

CREATE OR REPLACE FUNCTION public.club_programacion_galeria()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',id,'title',title,
   'files',jsonb_build_object(
     'index.html',left(content#>>'{studio,files,index.html}',120000),
     'style.css',left(coalesce(content#>>'{studio,files,style.css}',''),120000),
     'script.js',left(coalesce(content#>>'{studio,files,script.js}',''),120000),
     'game-config.js',left(coalesce(content#>>'{studio,files,game-config.js}',''),120000),
     'game.js',left(coalesce(content#>>'{studio,files,game.js}',''),120000)
   )
 ) order by published_at desc),'[]'::jsonb)
 from (
   select id,title,content,published_at
   from public.club_creator_projects
   where institution_id='88c4af03-bdce-48e6-b548-b6904fe704bd'::uuid
   and type='web' and status='published'
   and lower(coalesce(content#>>'{studio,files,tipo-club.txt}','')) not in ('paginas','aplicaciones')
   and content#>>'{studio,files,index.html}' is not null
   and (
    content#>>'{studio,files,script.js}' is not null
    or content#>>'{studio,files,game.js}' is not null
   )
   order by published_at desc limit 80
 ) approved;
$function$;
