-- AppNamn: installation of the existing request and bracelet features.
-- Run in the existing app database, not in an empty Supabase project.
-- Preserves the original script order and each transaction.

-- ============================================================
-- confirm-help-completion.sql
-- ============================================================
-- Run in the app project's SQL Editor. Includes volunteer release support.
-- Waiting for confirmation remains 'accepted', keeping both active-slot limits.
-- Only the request owner can change an accepted request to 'completed'.
begin;

alter table public.help_requests
  add column if not exists completion_requested_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.help_requests drop constraint help_requests_status_check;
alter table public.help_requests add constraint help_requests_status_check
  check (status in ('pending', 'accepted', 'cancelled', 'completed'));
alter table public.help_requests drop constraint help_requests_check;
alter table public.help_requests add constraint help_requests_check check (
  (status = 'pending' and helper_account_id is null and accepted_at is null and completion_requested_at is null and completed_at is null)
  or (status = 'accepted' and helper_account_id is not null and accepted_at is not null and completed_at is null)
  or (status = 'completed' and helper_account_id is not null and accepted_at is not null and completion_requested_at is not null and completed_at is not null)
  or (status = 'cancelled' and completed_at is null)
);

grant select (completion_requested_at, completed_at), update (completion_requested_at)
  on public.help_requests to authenticated;

-- Preserve insert, accept, recipient cancellation and assigned-helper release.
-- Add a server-stamped request for confirmation and the owner's response.
create or replace function public.guard_help_request()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  first_name_value text;
begin
  if current_user_id is null then
    raise exception 'Du måste vara inloggad.';
  end if;

  if tg_op = 'INSERT' then
    select r.first_name into first_name_value
    from public.help_recipients r
    where r.id = new.recipient_id and r.account_id = current_user_id;
    if not found then
      raise exception 'Du kan bara skapa en förfrågan för din egen registrering.';
    end if;

    new.created_by := current_user_id;
    new.recipient_name := coalesce(first_name_value, '');
    new.status := 'pending';
    new.helper_account_id := null;
    new.helper_name := null;
    new.accepted_at := null;
    new.completion_requested_at := null;
    new.completed_at := null;
    new.created_at := now();
    new.is_test := true;
    return new;
  end if;

  if old.status = 'pending' and new.status = 'accepted'
    and old.created_by <> current_user_id then
    if not exists (
      select 1 from public.helper_certificates c
      where c.account_id = current_user_id and c.status = 'approved'
    ) then
      raise exception 'Ett godkänt utbildningsintyg krävs.';
    end if;

    select h.first_name into first_name_value
    from public.helper_profiles h where h.account_id = current_user_id;
    if not found then
      raise exception 'Din volontärprofil saknas.';
    end if;

    new.helper_account_id := current_user_id;
    new.helper_name := coalesce(first_name_value, '');
    new.accepted_at := now();
    new.completion_requested_at := null;
    new.completed_at := null;
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'pending'
    and old.helper_account_id = current_user_id
    and old.created_by <> current_user_id then
    new.helper_account_id := null;
    new.helper_name := null;
    new.accepted_at := null;
    new.completion_requested_at := null;
    new.completed_at := null;
    return new;
  end if;

  -- Only the assigned volunteer can ask for confirmation. The server supplies time.
  if old.status = 'accepted' and new.status = 'accepted'
    and old.helper_account_id = current_user_id
    and old.created_by <> current_user_id
    and old.completion_requested_at is null
    and new.completion_requested_at is not null then
    new.completion_requested_at := now();
    return new;
  end if;

  -- Only the request owner (including an account registering a relative) responds.
  if old.status = 'accepted' and old.created_by = current_user_id
    and old.completion_requested_at is not null then
    if new.status = 'completed' then
      new.completed_at := now();
      return new;
    end if;
    if new.status = 'accepted' and new.completion_requested_at is null then
      return new;
    end if;
  end if;

  if old.status in ('pending', 'accepted') and new.status = 'cancelled'
    and old.created_by = current_user_id then
    return new;
  end if;

  raise exception 'Förfrågan kan inte ändras på det sättet.';
end;
$function$;

alter policy help_requests_change on public.help_requests
using (
  created_by = (select auth.uid())
  or (
    status = 'pending' and created_by <> (select auth.uid())
    and exists (
      select 1 from public.helper_certificates c
      where c.account_id = (select auth.uid()) and c.status = 'approved'
    )
  )
  or (status = 'accepted' and helper_account_id = (select auth.uid()))
)
with check (
  (created_by = (select auth.uid()) and status in ('cancelled', 'completed'))
  or (created_by = (select auth.uid()) and status = 'accepted' and completion_requested_at is null)
  or (
    helper_account_id = (select auth.uid()) and status = 'accepted'
    and exists (
      select 1 from public.helper_certificates c
      where c.account_id = (select auth.uid()) and c.status = 'approved'
    )
  )
  or (
    status = 'pending' and helper_account_id is null
    and helper_name is null and accepted_at is null
    and created_by <> (select auth.uid())
  )
);

-- Release uses the caller's existing RLS and status-only UPDATE permission.
-- All functions below are SECURITY INVOKER and keep triggers/RLS active.
create or replace function public.release_help_request(p_request_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Du måste vara inloggad.' using errcode = '42501';
  end if;

  update public.help_requests
  set status = 'pending'
  where id = p_request_id and status = 'accepted'
    and helper_account_id = (select auth.uid());

  if not found then
    raise exception 'Uppdraget är inte längre tilldelat dig.' using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function public.release_help_request(uuid) from public, anon;
grant execute on function public.release_help_request(uuid) to authenticated;

create or replace function public.get_help_request_completion(p_request_id uuid)
returns table (status text, completion_requested_at timestamptz, completed_at timestamptz)
language sql stable security invoker set search_path = ''
as $function$
  select q.status, q.completion_requested_at, q.completed_at
  from public.help_requests q where q.id = p_request_id;
$function$;

create or replace function public.request_help_completion(p_request_id uuid)
returns timestamptz
language plpgsql security invoker set search_path = ''
as $function$
declare
  request_row record;
  requested_at timestamptz;
begin
  select id, status, created_by, helper_account_id, completion_requested_at, completed_at
  into request_row from public.help_requests
  where id = p_request_id and status = 'accepted' and helper_account_id = auth.uid()
  for update;
  if not found then
    raise exception 'Uppdraget är inte tilldelat dig.' using errcode = 'P0002';
  end if;
  if request_row.completion_requested_at is not null then
    return request_row.completion_requested_at;
  end if;
  update public.help_requests set completion_requested_at = now()
  where id = p_request_id returning completion_requested_at into requested_at;
  return requested_at;
end;
$function$;

create or replace function public.respond_help_completion(
  p_request_id uuid, p_requested_at timestamptz, p_confirm boolean
)
returns timestamptz
language plpgsql security invoker set search_path = ''
as $function$
declare
  request_row record;
  confirmed_at timestamptz;
begin
  select id, status, created_by, helper_account_id, completion_requested_at, completed_at
  into request_row from public.help_requests
  where id = p_request_id and created_by = auth.uid() for update;
  if not found or p_requested_at is null or p_confirm is null
    or request_row.completion_requested_at is distinct from p_requested_at then
    raise exception 'Förfrågan har ändrats. Uppdatera och försök igen.' using errcode = 'P0002';
  end if;
  -- Retrying a confirmation after a lost response is safe.
  if request_row.status = 'completed' and p_confirm then
    return request_row.completed_at;
  end if;
  if request_row.status <> 'accepted' then
    raise exception 'Förfrågan är inte längre pågående.' using errcode = 'P0002';
  end if;
  if p_confirm then
    update public.help_requests set status = 'completed'
    where id = p_request_id returning completed_at into confirmed_at;
    return confirmed_at;
  end if;
  update public.help_requests set completion_requested_at = null where id = p_request_id;
  return null;
end;
$function$;

revoke all on function public.get_help_request_completion(uuid) from public, anon;
revoke all on function public.request_help_completion(uuid) from public, anon;
revoke all on function public.respond_help_completion(uuid, timestamptz, boolean) from public, anon;
grant execute on function public.get_help_request_completion(uuid) to authenticated;
grant execute on function public.request_help_completion(uuid) to authenticated;
grant execute on function public.respond_help_completion(uuid, timestamptz, boolean) to authenticated;

-- Preserve device inserts if this older setup script is rerun after SOS activation.
do $preserve_sos$
begin
  if to_regprocedure('bracelet_private.install_sos_guard()') is not null then
    perform bracelet_private.install_sos_guard();
  end if;
end;
$preserve_sos$;

notify pgrst, 'reload schema';
commit;

-- ============================================================
-- pair-bracelet.sql
-- ============================================================
-- Run once in the app project's SQL Editor. Does not change help requests.
begin;

create schema if not exists bracelet_private;
revoke all on schema bracelet_private from public, anon, authenticated;
grant usage on schema bracelet_private to authenticated;

create table if not exists bracelet_private.devices (
  device_id uuid primary key,
  secret_hash bytea not null check (octet_length(secret_hash) = 32),
  recipient_id uuid unique references public.help_recipients(id) on delete set null,
  paired_at timestamptz
);
alter table bracelet_private.devices enable row level security;
revoke all on bracelet_private.devices from public, anon, authenticated;

-- Privileged operations stay outside the exposed API schema. Every operation
-- checks recipient ownership using auth.uid(), never user-editable metadata.
create or replace function bracelet_private.get_link(p_recipient_id uuid)
returns table (device_id uuid, paired_at timestamptz)
language sql stable security definer set search_path = ''
as $function$
  select d.device_id, d.paired_at
  from bracelet_private.devices d
  join public.help_recipients r on r.id = d.recipient_id
  where r.id = p_recipient_id and r.account_id = (select auth.uid());
$function$;

create or replace function bracelet_private.pair(
  p_recipient_id uuid, p_device_id uuid, p_device_secret text
)
returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  device_row bracelet_private.devices%rowtype;
  hash_value bytea;
begin
  if auth.uid() is null or p_device_id is null or p_device_secret is null
    or p_device_secret !~ '^[0-9a-f]{64}$' then
    raise exception 'Ogiltig armbandskoppling.' using errcode = '22023';
  end if;
  -- Serialize changes for one person and independently for one device.
  perform 1 from public.help_recipients r
  where r.id = p_recipient_id and r.account_id = (select auth.uid()) for update;
  if not found then
    raise exception 'Du kan bara koppla armband till dina egna registreringar.'
      using errcode = '42501';
  end if;
  hash_value := pg_catalog.sha256(pg_catalog.convert_to(p_device_secret, 'UTF8'));
  insert into bracelet_private.devices(device_id, secret_hash)
  values (p_device_id, hash_value) on conflict (device_id) do nothing;
  select * into device_row from bracelet_private.devices
  where device_id = p_device_id for update;
  if device_row.secret_hash <> hash_value then
    raise exception 'Armbandet kunde inte verifieras.' using errcode = '42501';
  end if;
  if device_row.recipient_id is not null and device_row.recipient_id <> p_recipient_id then
    raise exception 'Armbandet är redan kopplat till en annan person.' using errcode = '23505';
  end if;
  update bracelet_private.devices
  set recipient_id = p_recipient_id,
      paired_at = case when recipient_id is null then now() else coalesce(paired_at, now()) end
  where device_id = p_device_id;
  return p_device_id;
end;
$function$;

create or replace function bracelet_private.unlink(p_recipient_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $function$
begin
  perform 1 from public.help_recipients r
  where r.id = p_recipient_id and r.account_id = (select auth.uid()) for update;
  if auth.uid() is null or not found then
    raise exception 'Du kan bara ta bort dina egna armbandskopplingar.' using errcode = '42501';
  end if;
  -- Retain the device fingerprint: unlinking must not allow a new caller to
  -- register the same identifier with a different secret.
  update bracelet_private.devices set recipient_id = null, paired_at = null
  where recipient_id = p_recipient_id;
end;
$function$;

create or replace function public.get_bracelet_link(p_recipient_id uuid)
returns table (device_id uuid, paired_at timestamptz)
language sql stable security invoker set search_path = ''
as $function$
  select * from bracelet_private.get_link(p_recipient_id);
$function$;

create or replace function public.pair_bracelet(
  p_recipient_id uuid, p_device_id uuid, p_device_secret text
)
returns uuid
language sql security invoker set search_path = ''
as $function$
  select bracelet_private.pair(p_recipient_id, p_device_id, p_device_secret);
$function$;

create or replace function public.unlink_bracelet(p_recipient_id uuid)
returns void
language sql security invoker set search_path = ''
as $function$
  select bracelet_private.unlink(p_recipient_id);
$function$;

revoke all on function bracelet_private.get_link(uuid), bracelet_private.pair(uuid, uuid, text),
  bracelet_private.unlink(uuid), public.get_bracelet_link(uuid),
  public.pair_bracelet(uuid, uuid, text), public.unlink_bracelet(uuid) from public, anon, authenticated;
grant execute on function bracelet_private.get_link(uuid), bracelet_private.pair(uuid, uuid, text),
  bracelet_private.unlink(uuid), public.get_bracelet_link(uuid),
  public.pair_bracelet(uuid, uuid, text), public.unlink_bracelet(uuid) to authenticated;

-- Retain access to the separately authenticated device RPC after SOS activation.
do $preserve_sos$
begin
  if to_regprocedure('bracelet_private.sos(uuid,text,uuid,boolean)') is not null then
    grant usage on schema bracelet_private to anon;
  end if;
end;
$preserve_sos$;

notify pgrst, 'reload schema';
commit;

-- ============================================================
-- bracelet-sos.sql
-- ============================================================
-- Run after pair-bracelet.sql. Existing request policies and state changes stay intact.
begin;

alter table bracelet_private.devices add column if not exists last_sos_at timestamptz;

create table if not exists bracelet_private.sos_events (
  device_id uuid not null references bracelet_private.devices(device_id),
  event_id uuid not null,
  recipient_id uuid not null references public.help_recipients(id) on delete cascade,
  request_id uuid references public.help_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (device_id, event_id)
);
create table if not exists bracelet_private.sos_insert_permissions (
  request_id uuid primary key,
  recipient_id uuid not null,
  transaction_id xid8 not null
);
alter table bracelet_private.sos_events enable row level security;
alter table bracelet_private.sos_insert_permissions enable row level security;
revoke all on bracelet_private.sos_events, bracelet_private.sos_insert_permissions
  from public, anon, authenticated;

-- A short-lived permission exists only inside a verified device transaction.
-- No JWT impersonation, disabled trigger or client-controlled session flag.
create or replace function bracelet_private.sos_insert_owner(p_request_id uuid, p_recipient_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $function$
  select r.account_id
  from bracelet_private.sos_insert_permissions permission
  join public.help_recipients r on r.id = permission.recipient_id
  where permission.request_id = p_request_id and permission.recipient_id = p_recipient_id
    and permission.transaction_id = pg_catalog.pg_current_xact_id();
$function$;
revoke all on function bracelet_private.sos_insert_owner(uuid, uuid) from public, anon, authenticated;

-- Add one narrowly scoped insert branch to the current guard; preserve its actual
-- existing accept/cancel/release/completion rules instead of replacing them.
create or replace function bracelet_private.install_sos_guard()
returns void language plpgsql security invoker set search_path = ''
as $patch$
declare
  definition text;
  needle text := '  if current_user_id is null then';
  addition text := E'  if current_user_id is null and tg_op = ''INSERT'' then\n' ||
    '    current_user_id := bracelet_private.sos_insert_owner(new.id, new.recipient_id);' ||
    E'\n  end if;\n\n';
begin
  definition := pg_catalog.pg_get_functiondef('public.guard_help_request()'::regprocedure);
  if position('bracelet_private.sos_insert_owner(new.id, new.recipient_id)' in definition) = 0 then
    if position('current_user_id uuid := auth.uid()' in definition) = 0
       or (length(definition) - length(replace(definition, needle, ''))) <> length(needle) then
      raise exception 'Unknown request guard: no changes applied. Inspect guard_help_request before enabling SOS.';
    end if;
    execute replace(definition, needle, addition || needle);
  end if;
end;
$patch$;
revoke all on function bracelet_private.install_sos_guard() from public, anon, authenticated;
select bracelet_private.install_sos_guard();

create or replace function bracelet_private.sos_reply(p_request_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $function$
  select coalesce((
    select pg_catalog.jsonb_build_object(
      'request_id', q.id, 'status', q.status,
      'completion_requested', (pg_catalog.to_jsonb(q)->>'completion_requested_at') is not null
    ) from public.help_requests q where q.id = p_request_id
  ), '{"status":"unavailable"}'::jsonb);
$function$;
revoke all on function bracelet_private.sos_reply(uuid) from public, anon, authenticated;

create or replace function bracelet_private.sos(
  p_device_id uuid, p_device_secret text, p_event_id uuid, p_send boolean
)
returns jsonb
language plpgsql security definer set search_path = ''
as $function$
declare
  device_row bracelet_private.devices%rowtype;
  event_row bracelet_private.sos_events%rowtype;
  request_id_value uuid;
  recipient_id_value uuid;
begin
  if p_device_id is null or p_device_secret is null
    or p_device_secret !~ '^[0-9a-f]{64}$' or p_send is null then
    raise exception 'DEVICE_NOT_AUTHORIZED' using errcode = '42501';
  end if;
  select * into device_row from bracelet_private.devices where device_id = p_device_id;
  if not found or device_row.recipient_id is null or device_row.secret_hash <>
    pg_catalog.sha256(pg_catalog.convert_to(p_device_secret, 'UTF8')) then
    raise exception 'DEVICE_NOT_AUTHORIZED' using errcode = '42501';
  end if;
  recipient_id_value := device_row.recipient_id;
  if not exists (select 1 from public.help_recipients r
                 where r.id = recipient_id_value and r.registration_completed_at is not null) then
    raise exception 'DEVICE_NOT_AUTHORIZED' using errcode = '42501';
  end if;
  if p_event_id is null then
    if p_send then raise exception 'EVENT_ID_REQUIRED' using errcode = '22023'; end if;
    return '{"status":"idle"}'::jsonb;
  end if;

  -- Match the pairing/unlink lock order: person first, then device.
  if p_send then
    perform 1 from public.help_recipients where id = recipient_id_value for update;
    select * into device_row from bracelet_private.devices where device_id = p_device_id for update;
    if not found or device_row.recipient_id is distinct from recipient_id_value then
      raise exception 'DEVICE_NOT_AUTHORIZED' using errcode = '42501';
    end if;
  end if;

  select * into event_row from bracelet_private.sos_events
  where device_id = p_device_id and event_id = p_event_id;
  if found then
    if event_row.recipient_id <> recipient_id_value then
      raise exception 'DEVICE_NOT_AUTHORIZED' using errcode = '42501';
    end if;
    -- Even a cancelled/completed/deleted request cannot be recreated by a retry.
    return bracelet_private.sos_reply(event_row.request_id);
  end if;
  if not p_send then return '{"status":"not_found"}'::jsonb; end if;
  if device_row.last_sos_at > clock_timestamp() - interval '5 seconds' then
    return '{"status":"rate_limited"}'::jsonb;
  end if;

  select q.id into request_id_value from public.help_requests q
  where q.recipient_id = recipient_id_value and q.status in ('pending', 'accepted')
  order by q.created_at desc limit 1;
  if request_id_value is null then
    request_id_value := pg_catalog.gen_random_uuid();
    begin
      insert into bracelet_private.sos_insert_permissions values
        (request_id_value, recipient_id_value, pg_catalog.pg_current_xact_id());
      insert into public.help_requests(id, recipient_id) values (request_id_value, recipient_id_value);
      delete from bracelet_private.sos_insert_permissions where request_id = request_id_value;
    exception when unique_violation then
      -- An app request can win the recipient's existing unique active-slot index.
      select q.id into request_id_value from public.help_requests q
      where q.recipient_id = recipient_id_value and q.status in ('pending', 'accepted')
      order by q.created_at desc limit 1;
      if request_id_value is null then raise; end if;
    end;
  end if;
  insert into bracelet_private.sos_events(device_id, event_id, recipient_id, request_id)
  values (p_device_id, p_event_id, recipient_id_value, request_id_value);
  update bracelet_private.devices set last_sos_at = clock_timestamp() where device_id = p_device_id;
  return bracelet_private.sos_reply(request_id_value);
end;
$function$;

create or replace function public.bracelet_sos(
  p_device_id uuid, p_device_secret text, p_event_id uuid, p_send boolean
)
returns jsonb
language sql security invoker set search_path = ''
as $function$
  select bracelet_private.sos(p_device_id, p_device_secret, p_event_id, p_send);
$function$;
-- The device uses its own secret, not a person's password/JWT or an admin key.
grant usage on schema bracelet_private to anon;
revoke all on function bracelet_private.sos(uuid, text, uuid, boolean),
  public.bracelet_sos(uuid, text, uuid, boolean) from public, anon, authenticated;
grant execute on function bracelet_private.sos(uuid, text, uuid, boolean),
  public.bracelet_sos(uuid, text, uuid, boolean) to anon;

create or replace function public.bracelet_sos_version()
returns integer language sql immutable security invoker set search_path = ''
as $function$ select 1; $function$;
revoke all on function public.bracelet_sos_version() from public, anon, authenticated;
grant execute on function public.bracelet_sos_version() to authenticated;

notify pgrst, 'reload schema';
commit;

