-- Oni Studio | Migration 151: fix SQLSTATE 42704 when saving category positions.
-- Root cause: SECURITY DEFINER functions use search_path = '', but their
-- SET CONSTRAINTS statement used an unqualified constraint name.
--
-- Run in the Supabase SQL Editor AFTER migration 150 succeeded.
-- Safe to rerun. Preserves existing categories, visibility, ordering,
-- RLS policies, function security and permissions. No data UPDATE/DELETE.
--
-- DO NOT call these admin-only functions in SQL Editor to test them:
-- is_admin() checks the signed-in application's auth.uid(), not the
-- SQL Editor database role.

begin;

do $fix$
declare
  v_constraint_ok boolean;
  v_signatures text[] := array[
    'public.normalize_equipment_category_order_v2()',
    'public.save_equipment_category_v2(uuid,text,text,text,boolean)',
    'public.set_equipment_category_position_v2(uuid,integer)',
    'public.delete_equipment_category_v2(uuid)'
  ];
  v_signature text;
  v_function_oid oid;
  v_definition text;
  v_fixed_definition text;
  v_fixed_count integer := 0;
begin
  -- Validate the actual constraint on the expected table.
  select (c.contype = 'u' and c.condeferrable)
    into v_constraint_ok
  from pg_catalog.pg_constraint as c
  where c.conrelid = 'public.equipment_categories'::pg_catalog.regclass
    and c.conname = 'equipment_categories_sort_order_unique_v2';

  if v_constraint_ok is distinct from true then
    raise exception using
      errcode = '42704',
      message = 'Migration 150 is incomplete: missing DEFERRABLE UNIQUE constraint on public.equipment_categories',
      hint = 'Inspect equipment_categories constraints and the SQL Editor result of migration 150 before using this hotfix.';
  end if;

  foreach v_signature in array v_signatures loop
    v_function_oid := pg_catalog.to_regprocedure(v_signature)::oid;

    if v_function_oid is null then
      raise exception using
        errcode = '42883',
        message = format('Missing function from migration 150: %s', v_signature),
        hint = 'Run migration 150 successfully before migration 151.';
    end if;

    v_definition := pg_catalog.pg_get_functiondef(v_function_oid);

    -- Modify only the unqualified constraint statement inside this exact
    -- existing function, preserving its full definition and grants.
    v_fixed_definition := pg_catalog.regexp_replace(
      v_definition,
      'set[[:space:]]+constraints[[:space:]]+equipment_categories_sort_order_unique_v2[[:space:]]+deferred',
      'SET CONSTRAINTS public.equipment_categories_sort_order_unique_v2 DEFERRED',
      'gi'
    );

    if v_fixed_definition <> v_definition then
      execute v_fixed_definition;
      v_fixed_count := v_fixed_count + 1;
      raise notice 'Repaired %', v_signature;
    elsif pg_catalog.strpos(
      pg_catalog.lower(v_definition),
      'public.equipment_categories_sort_order_unique_v2'
    ) > 0 then
      raise notice 'Already repaired: %', v_signature;
    else
      raise exception using
        errcode = '22023',
        message = format('Unexpected SQL function definition: %s', v_signature),
        hint = 'Do not overwrite this function blindly. Review the current pg_get_functiondef output.';
    end if;
  end loop;

  raise notice 'Category constraint schema fix complete. Functions updated: %', v_fixed_count;
end
$fix$;

commit;

-- Read-only validation: schema-qualified SET CONSTRAINTS must be true.
-- All four function rows should say true.
select
  p.proname as function_name,
  pg_catalog.strpos(
    pg_catalog.lower(pg_catalog.pg_get_functiondef(p.oid)),
    'public.equipment_categories_sort_order_unique_v2'
  ) > 0 as uses_qualified_constraint
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any(array[
    'normalize_equipment_category_order_v2',
    'save_equipment_category_v2',
    'set_equipment_category_position_v2',
    'delete_equipment_category_v2'
  ])
order by p.proname;
