-- Krueka ID: reservar direcciones, documentar consentimiento y registrar estados externos.
-- Fase 1: NO provisiona buzones, DNS, cuentas Google, ni almacena contraseñas.
create table if not exists public.academia_identities (
  student_id uuid primary key references public.academia_students(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  alias text not null unique check (alias ~ '^[a-z][a-z0-9]{2,19}$'),
  address text generated always as (alias || '@krueka.com') stored unique,
  consent_verified boolean not null default false,
  consent_recorded_at timestamptz,
  consent_recorded_by uuid references public.profiles(id),
  consent_revoked_at timestamptz,
  routing_state text not null default 'sin_configurar'
    check (routing_state in ('sin_configurar','verificado_por_administrador')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.academia_external_registry (
  student_id uuid not null references public.academia_identities(student_id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  platform text not null
    check (platform in ('classroom','codeorg','scratch','tinkercad','otra')),
  state text not null default 'pendiente'
    check (state in ('pendiente','gestionando','registrado_manual','suspendido')),
  requirements_checked_at timestamptz,
  checked_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key(student_id,platform)
);
create index if not exists academia_identities_by_owner on public.academia_identities(owner_id);
create index if not exists academia_external_registry_by_owner on public.academia_external_registry(owner_id);
alter table public.academia_identities enable row level security;
alter table public.academia_external_registry enable row level security;
revoke all on public.academia_identities,public.academia_external_registry
  from public,anon,authenticated;

create or replace function public.academia_identity_manage(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
  v_owner uuid:=auth.uid();
  v_student uuid;
  v_alias text;
  v_platform text;
  v_state text;
  v_rows jsonb;
  v_identity record;
begin
  if v_owner is null or not exists (
    select 1 from public.profiles p
    where p.id=v_owner and p.activo and p.role::text in ('admin','docente')
  ) then
    return jsonb_build_object('ok',false,'error','Ingresá como docente autorizado.');
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then
    return jsonb_build_object('ok',false,'error','Datos inválidos.');
  end if;

  if p_action='list' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'student_id',s.id,'name',s.name,'active',s.active,
      'email',i.address,'alias',i.alias,'consent_verified',coalesce(i.consent_verified,false),
      'consent_recorded_at',i.consent_recorded_at,
      'routing_state',coalesce(i.routing_state,'sin_configurar'),
      'accounts',coalesce((
        select jsonb_agg(jsonb_build_object(
          'platform',r.platform,'state',r.state,'requirements_checked',r.requirements_checked_at is not null
        ) order by r.platform)
        from public.academia_external_registry r
        where r.student_id=s.id and r.owner_id=v_owner
      ),'[]'::jsonb)
    ) order by s.name),'[]'::jsonb) into v_rows
    from public.academia_students s
    left join public.academia_identities i
      on i.student_id=s.id and i.owner_id=v_owner
    where s.owner_id=v_owner;
    return jsonb_build_object('ok',true,'students',v_rows,'mail_active',false,
      'notice','Direcciones reservadas: el correo no recibirá mensajes hasta configurar y probar el proveedor.');

  elsif p_action in ('reserve','reconsent','revoke','platform_set') then
    v_student=nullif(p_payload->>'student_id','')::uuid;
    if v_student is null or not exists(
      select 1 from public.academia_students s
      where s.id=v_student and s.owner_id=v_owner and s.active
    ) then
      return jsonb_build_object('ok',false,'error','Alumno activo no encontrado en tu Academia.');
    end if;

    if p_action='reserve' then
      if coalesce((p_payload->>'consent_verified')::boolean,false) is not true then
        return jsonb_build_object('ok',false,'error','Primero confirmá que tenés autorización verificable del responsable.');
      end if;
      v_alias=lower(trim(coalesce(p_payload->>'alias','')));
      if v_alias !~ '^[a-z][a-z0-9]{2,19}$'
         or v_alias in ('admin','soporte','support','contacto','info','root','abuse',
                        'security','postmaster','webmaster','noreply','krueka',
                        'docente','alumnos','direccion','ventas','billing','privacy',
                        'privacidad','legal','help','gmail','classroom') then
        return jsonb_build_object('ok',false,'error','Alias no permitido. Usá entre 3 y 20 letras/números, empezando por letra.');
      end if;
      if exists(select 1 from public.academia_identities where student_id=v_student) then
        return jsonb_build_object('ok',false,'error','Este alumno ya tiene una dirección reservada.');
      end if;
      begin
        insert into public.academia_identities
          (student_id,owner_id,alias,consent_verified,consent_recorded_at,consent_recorded_by)
        values(v_student,v_owner,v_alias,true,now(),v_owner)
        returning * into v_identity;
      exception when unique_violation then
        return jsonb_build_object('ok',false,'error','Este alias ya está reservado. Elegí otro distinto.');
      end;
      return jsonb_build_object('ok',true,'email',v_identity.address,
        'routing_state',v_identity.routing_state,'mail_active',false);

    elsif p_action='reconsent' then
      if coalesce((p_payload->>'consent_verified')::boolean,false) is not true then
        return jsonb_build_object('ok',false,'error','Se necesita autorización verificable.');
      end if;
      update public.academia_identities set
        consent_verified=true,consent_recorded_at=now(),
        consent_recorded_by=v_owner,consent_revoked_at=null,updated_at=now()
      where student_id=v_student and owner_id=v_owner;
      if not found then return jsonb_build_object('ok',false,'error','Identidad inexistente.'); end if;
      return jsonb_build_object('ok',true);

    elsif p_action='revoke' then
      update public.academia_identities set
        consent_verified=false,consent_revoked_at=now(),updated_at=now()
      where student_id=v_student and owner_id=v_owner;
      if not found then return jsonb_build_object('ok',false,'error','Identidad inexistente.'); end if;
      update public.academia_external_registry set state='suspendido',updated_at=now()
      where student_id=v_student and owner_id=v_owner;
      return jsonb_build_object('ok',true,
        'notice','Autorización revocada dentro de Krueka. Debés suspender las cuentas externas también desde sus administradores.');

    elsif p_action='platform_set' then
      select i.* into v_identity from public.academia_identities i
      where i.student_id=v_student and i.owner_id=v_owner and i.consent_verified;
      if not found then
        return jsonb_build_object('ok',false,'error','Falta la autorización vigente del responsable.');
      end if;
      v_platform=coalesce(p_payload->>'platform','');
      v_state=coalesce(p_payload->>'state','');
      if v_platform not in ('classroom','codeorg','scratch','tinkercad','otra')
         or v_state not in ('pendiente','gestionando','registrado_manual','suspendido') then
        return jsonb_build_object('ok',false,'error','Plataforma o estado inválido.');
      end if;
      if v_state in ('gestionando','registrado_manual') and
         coalesce((p_payload->>'requirements_checked')::boolean,false) is not true then
        return jsonb_build_object('ok',false,'error','Confirmá antes las reglas de edad, autorización y acceso de esa plataforma.');
      end if;
      if v_platform='classroom' and v_state in ('gestionando','registrado_manual') and
         coalesce((p_payload->>'education_account_verified')::boolean,false) is not true then
        return jsonb_build_object('ok',false,'error','Classroom para menores requiere verificar primero la vía institucional adecuada.');
      end if;
      insert into public.academia_external_registry(
        student_id,owner_id,platform,state,requirements_checked_at,checked_by
      )values(
        v_student,v_owner,v_platform,v_state,
        case when v_state in ('gestionando','registrado_manual') then now() else null end,
        case when v_state in ('gestionando','registrado_manual') then v_owner else null end
      )
      on conflict(student_id,platform) do update
      set state=excluded.state,requirements_checked_at=excluded.requirements_checked_at,
          checked_by=excluded.checked_by,updated_at=now();
      return jsonb_build_object('ok',true,'notice',
        'Estado registrado manualmente. Krueka no creó una cuenta en la plataforma externa.');
    end if;
  end if;
  return jsonb_build_object('ok',false,'error','Acción no reconocida.');
exception when invalid_text_representation then
  return jsonb_build_object('ok',false,'error','Identificador inválido.');
end;
$function$;
revoke all on function public.academia_identity_manage(text,jsonb) from public,anon,authenticated;
grant execute on function public.academia_identity_manage(text,jsonb) to authenticated;
