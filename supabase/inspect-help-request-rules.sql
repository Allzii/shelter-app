-- Read-only. Run in TryggNära's SQL Editor and copy the resulting JSON.
-- Includes database rules only, no request rows or personal information.
select jsonb_pretty(jsonb_build_object(
  'triggers', (
    select jsonb_agg(jsonb_build_object(
      'name', t.tgname,
      'trigger', pg_get_triggerdef(t.oid),
      'function', pg_get_functiondef(t.tgfoid)
    ) order by t.tgname)
    from pg_trigger t
    where t.tgrelid = 'public.help_requests'::regclass
      and not t.tgisinternal
  ),
  'policies', (
    select jsonb_agg(to_jsonb(p))
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'help_requests'
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_object(
      'name', c.conname, 'definition', pg_get_constraintdef(c.oid)
    ))
    from pg_constraint c
    where c.conrelid = 'public.help_requests'::regclass
  ),
  'indexes', (
    select jsonb_agg(jsonb_build_object('name', indexname, 'definition', indexdef))
    from pg_indexes
    where schemaname = 'public' and tablename = 'help_requests'
  ),
  'column_permissions', (
    select jsonb_agg(jsonb_build_object(
      'column', column_name, 'privilege', privilege_type
    ))
    from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'help_requests'
      and grantee = 'authenticated'
  )
)) as help_request_rules;
