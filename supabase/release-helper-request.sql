-- Run once in TryggNära's SQL Editor. No existing requests are changed.
begin;

-- Preserve the existing insert, accept and recipient-cancel rules. Add only
-- accepted -> pending for the volunteer currently assigned to the request.
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
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'pending'
    and old.helper_account_id = current_user_id
    and old.created_by <> current_user_id then
    new.helper_account_id := null;
    new.helper_name := null;
    new.accepted_at := null;
    return new;
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
  (created_by = (select auth.uid()) and status = 'cancelled')
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

-- Uses the caller's existing RLS and status-only UPDATE permission.
-- No SECURITY DEFINER, impersonation, extra column rights or trigger bypass.
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

notify pgrst, 'reload schema';
commit;
