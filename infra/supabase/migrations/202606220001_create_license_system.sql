create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'license_status') then
    create type public.license_status as enum (
      'ACTIVE',
      'REVOKED',
      'REFUNDED',
      'CHARGEBACK',
      'EXPIRED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'license_plan') then
    create type public.license_plan as enum ('PRO');
  end if;
end $$;

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text unique not null,
  license_key_hash text unique not null,
  email text not null,
  plan public.license_plan not null default 'PRO',
  status public.license_status not null default 'ACTIVE',
  max_devices integer not null default 3 check (max_devices > 0),
  gateway text not null check (gateway in ('cakto', 'lemonsqueezy')),
  gateway_order_id text,
  gateway_customer_id text,
  gateway_product_id text,
  gateway_variant_id text,
  purchased_at timestamptz default now(),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists licenses_gateway_order_idx
  on public.licenses (gateway, gateway_order_id)
  where gateway_order_id is not null;

create index if not exists licenses_email_idx on public.licenses (email);
create index if not exists licenses_status_idx on public.licenses (status);

create table if not exists public.license_devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_uuid text not null,
  user_agent text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  revoked_at timestamptz,
  unique (license_id, device_uuid)
);

create index if not exists license_devices_device_uuid_idx
  on public.license_devices (device_uuid);

create index if not exists license_devices_license_active_idx
  on public.license_devices (license_id)
  where revoked_at is null;

create table if not exists public.device_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  token_hash text unique not null,
  new_device_uuid text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists device_reset_tokens_license_idx
  on public.device_reset_tokens (license_id);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null check (gateway in ('cakto', 'lemonsqueezy')),
  gateway_event_id text,
  gateway_order_id text,
  event_type text not null,
  payload jsonb not null,
  payload_sha256 text not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz default now()
);

create unique index if not exists webhook_events_gateway_event_idx
  on public.webhook_events (gateway, gateway_event_id)
  where gateway_event_id is not null;

create unique index if not exists webhook_events_payload_sha_idx
  on public.webhook_events (gateway, payload_sha256);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists licenses_set_updated_at on public.licenses;
create trigger licenses_set_updated_at
before update on public.licenses
for each row
execute function public.set_updated_at();

create or replace function public.sha256_hex(value text)
returns text
language sql
immutable
strict
as $$
  select encode(digest(value, 'sha256'), 'hex');
$$;

create or replace function public.validate_license_device(
  p_license_key text,
  p_device_uuid text,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_license public.licenses%rowtype;
  v_device public.license_devices%rowtype;
  v_active_device_count integer;
begin
  if nullif(trim(p_license_key), '') is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;

  if nullif(trim(p_device_uuid), '') is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;

  select *
    into v_license
    from public.licenses
   where license_key = upper(trim(p_license_key))
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'LICENSE_NOT_FOUND');
  end if;

  if v_license.status <> 'ACTIVE' then
    return jsonb_build_object('ok', false, 'error', 'LICENSE_REVOKED');
  end if;

  select *
    into v_device
    from public.license_devices
   where license_id = v_license.id
     and device_uuid = p_device_uuid;

  if found and v_device.revoked_at is null then
    update public.license_devices
       set last_seen_at = now(),
           user_agent = coalesce(p_user_agent, user_agent)
     where id = v_device.id;
  else
    select count(*)
      into v_active_device_count
      from public.license_devices
     where license_id = v_license.id
       and revoked_at is null;

    if v_active_device_count >= v_license.max_devices then
      return jsonb_build_object('ok', false, 'error', 'DEVICE_LIMIT_EXCEEDED');
    end if;

    insert into public.license_devices (
      license_id,
      device_uuid,
      user_agent,
      first_seen_at,
      last_seen_at,
      revoked_at
    )
    values (
      v_license.id,
      p_device_uuid,
      p_user_agent,
      now(),
      now(),
      null
    )
    on conflict (license_id, device_uuid) do update
      set user_agent = coalesce(excluded.user_agent, public.license_devices.user_agent),
          last_seen_at = now(),
          revoked_at = null;
  end if;

  return jsonb_build_object(
    'ok', true,
    'license_id', v_license.id,
    'license_key_hash', v_license.license_key_hash,
    'plan', v_license.plan,
    'max_devices', v_license.max_devices
  );
end;
$$;

create or replace function public.confirm_device_reset(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.device_reset_tokens%rowtype;
begin
  if nullif(trim(p_token_hash), '') is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  end if;

  select *
    into v_token
    from public.device_reset_tokens
   where token_hash = p_token_hash
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  end if;

  if v_token.used_at is not null then
    return jsonb_build_object('ok', false, 'error', 'TOKEN_USED');
  end if;

  if v_token.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'TOKEN_EXPIRED');
  end if;

  update public.license_devices
     set revoked_at = now()
   where license_id = v_token.license_id
     and revoked_at is null;

  insert into public.license_devices (
    license_id,
    device_uuid,
    first_seen_at,
    last_seen_at,
    revoked_at
  )
  values (
    v_token.license_id,
    v_token.new_device_uuid,
    now(),
    now(),
    null
  )
  on conflict (license_id, device_uuid) do update
    set last_seen_at = now(),
        revoked_at = null;

  update public.device_reset_tokens
     set used_at = now()
   where id = v_token.id;

  return jsonb_build_object('ok', true);
end;
$$;

alter table public.licenses enable row level security;
alter table public.license_devices enable row level security;
alter table public.device_reset_tokens enable row level security;
alter table public.webhook_events enable row level security;

revoke all on public.licenses from anon, authenticated;
revoke all on public.license_devices from anon, authenticated;
revoke all on public.device_reset_tokens from anon, authenticated;
revoke all on public.webhook_events from anon, authenticated;
grant select, insert, update, delete on public.licenses to service_role;
grant select, insert, update, delete on public.license_devices to service_role;
grant select, insert, update, delete on public.device_reset_tokens to service_role;
grant select, insert, update, delete on public.webhook_events to service_role;

revoke all on function public.validate_license_device(text, text, text) from anon, authenticated;
revoke all on function public.confirm_device_reset(text) from anon, authenticated;
grant execute on function public.validate_license_device(text, text, text) to service_role;
grant execute on function public.confirm_device_reset(text) to service_role;
