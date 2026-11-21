-- La galería pública reconoce los libros ya aprobados sin mostrar borradores ni revisiones.
create or replace function public.club_krueka_public_galeria()
returns jsonb
language sql stable security definer
set search_path = ''
as $function$
 select coalesce(jsonb_agg(x.item order by x.published_at desc),'[]'::jsonb)
 from (
  select p.published_at,
   jsonb_build_object(
    'id',p.id,
    'title',left(p.title,80),
    'category',case
     when lower(coalesce(p.content#>>'{studio,files,tipo-club.txt}','')) in
      ('juegos','paginas','aplicaciones','blogs','historietas','cuentos','libros','dramas','animes','flyers','dibujos','animaciones','videos')
     then lower(p.content#>>'{studio,files,tipo-club.txt}')
     when p.type = 'design' then 'dibujos'
     else 'juegos'
    end,
    'published_at',p.published_at
   ) as item
  from public.club_creator_projects p
  where p.institution_id='88c4af03-bdce-48e6-b548-b6904fe704bd'::uuid
   and p.status='published'
   and p.type='web'
   and jsonb_typeof(p.content#>'{studio,files}')='object'
   and p.content#>>'{studio,files,index.html}' is not null
  order by p.published_at desc
  limit 80
 ) x;
$function$;
