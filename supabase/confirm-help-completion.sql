-- Run in TryggNära's SQL Editor. Includes volunteer release support.
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

notify pgrst, 'reload schema';
commit;
