-- Oni Studio: unique equipment-category ordering + public filter visibility.
-- Run ONCE or rerun safely in the Supabase SQL Editor before using the new Admin UI.
-- Requires migrations 001 and 003 (public.is_admin, equipment_categories).
-- Does not remove equipment or categories.

begin;

alter table public.equipment_categories
  add column if not exists is_visible boolean not null default true;

-- Fix legacy duplicate positions before introducing the unique constraint.
-- Keep the retired 'backdrop' category last, outside the public equipment filter.
do $migration$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.equipment_categories'::regclass
      and conname = 'equipment_categories_sort_order_unique_v2'
  ) then
    with ranked as (
      select id, (row_number() over (order by (slug = 'backdrop'), sort_order, id) - 1)::integer as next_position
      from public.equipment_categories
    )
    update public.equipment_categories as c
    set sort_order = ranked.next_position
    from ranked where c.id = ranked.id;

    alter table public.equipment_categories
      add constraint equipment_categories_sort_order_unique_v2
      unique (sort_order) deferrable initially immediate;
  end if;
end
$migration$;

-- Helper for all data changes: protected by is_admin and called within a transaction.
create or replace function public.normalize_equipment_category_order_v2()
returns void language plpgsql security definer set search_path = ''
as $function$
begin
  if (select public.is_admin()) is distinct from true then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;

  SET CONSTRAINTS public.equipment_categories_sort_order_unique_v2 DEFERRED;

  with ranked as (
    select id, (row_number() over (order by (slug = 'backdrop'), sort_order, id) - 1)::integer as next_position
    from public.equipment_categories
  )
  update public.equipment_categories as c
  set sort_order = ranked.next_position
  from ranked where c.id = ranked.id and c.sort_order is distinct from ranked.next_position;
end
$function$;

create or replace function public.save_equipment_category_v2(
  p_id uuid,
  p_slug text,
  p_name_vi text,
  p_name_en text,
  p_is_visible boolean default null
)
returns uuid language plpgsql security definer set search_path = ''
as $function$
declare
  v_id uuid;
  v_order integer;
  v_slug text := pg_catalog.btrim(p_slug);
  v_vi text := pg_catalog.btrim(p_name_vi);
  v_en text := pg_catalog.btrim(p_name_en);
begin
  if (select public.is_admin()) is distinct from true then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug) > 120 or v_slug = 'backdrop' then
    raise exception 'Invalid or reserved slug' using errcode = '22023';
  end if;
  if v_vi is null or length(v_vi) < 1 or length(v_vi) > 120 or v_en is null or length(v_en) < 1 or length(v_en) > 120 then
    raise exception 'Invalid category name' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(720260014);
  SET CONSTRAINTS public.equipment_categories_sort_order_unique_v2 DEFERRED;

  if p_id is null then
    select coalesce(max(sort_order), -1) + 1 into v_order from public.equipment_categories;
    if v_order > 100000 then
      raise exception 'Too many equipment categories' using errcode = '22023';
    end if;
    insert into public.equipment_categories (slug,name,sort_order,is_visible)
    values (v_slug,pg_catalog.jsonb_build_object('vi',v_vi,'en',v_en),v_order,coalesce(p_is_visible,true))
    returning id into v_id;
  else
    update public.equipment_categories
    set slug = v_slug,
        name = pg_catalog.jsonb_build_object('vi',v_vi,'en',v_en),
        is_visible = coalesce(p_is_visible,is_visible)
    where id = p_id and slug <> 'backdrop'
    returning id into v_id;
    if v_id is null then
      raise exception 'Category not found' using errcode = 'P0002';
    end if;
  end if;

  perform public.normalize_equipment_category_order_v2();
  return v_id;
end
$function$;

create or replace function public.set_equipment_category_visibility_v2(p_id uuid,p_visible boolean)
returns void language plpgsql security definer set search_path = ''
as $function$
begin
  if (select public.is_admin()) is distinct from true then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;
  if p_visible is null then
    raise exception 'Visibility is required' using errcode = '22023';
  end if;
  update public.equipment_categories set is_visible = p_visible
  where id = p_id and slug <> 'backdrop';
  if not found then raise exception 'Category not found' using errcode = 'P0002'; end if;
end
$function$;

-- Position is 1-based, among equipment categories (excluding legacy backdrop).
create or replace function public.set_equipment_category_position_v2(p_id uuid,p_position integer)
returns void language plpgsql security definer set search_path = ''
as $function$
declare
  v_ids uuid[];
  v_new_ids uuid[];
  v_final_ids uuid[];
  v_length integer;
begin
  if (select public.is_admin()) is distinct from true then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(720260014);
  SET CONSTRAINTS public.equipment_categories_sort_order_unique_v2 DEFERRED;

  select pg_catalog.array_agg(id order by sort_order,id) into v_ids
  from public.equipment_categories where slug <> 'backdrop';
  v_length := coalesce(pg_catalog.array_length(v_ids,1),0);

  if p_position is null or p_position < 1 or p_position > v_length then
    raise exception 'Position out of range' using errcode = '22023';
  end if;
  if not (p_id = any(v_ids)) then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  v_ids := pg_catalog.array_remove(v_ids,p_id);
  v_new_ids := coalesce(v_ids[1:p_position-1], array[]::uuid[])
    || array[p_id] || coalesce(v_ids[p_position:pg_catalog.array_length(v_ids,1)],array[]::uuid[]);
  select v_new_ids || coalesce(pg_catalog.array_agg(id order by sort_order,id),array[]::uuid[])
    into v_final_ids from public.equipment_categories where slug = 'backdrop';

  with desired as (
    select id, (ordinality - 1)::integer as next_position
    from pg_catalog.unnest(v_final_ids) with ordinality as item(id,ordinality)
  )
  update public.equipment_categories as c
  set sort_order = desired.next_position
  from desired where c.id = desired.id and c.sort_order is distinct from desired.next_position;
end
$function$;

create or replace function public.delete_equipment_category_v2(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $function$
begin
  if (select public.is_admin()) is distinct from true then
    raise exception 'Admin permission required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(720260014);
  SET CONSTRAINTS public.equipment_categories_sort_order_unique_v2 DEFERRED;
  delete from public.equipment_categories where id = p_id and slug <> 'backdrop';
  if not found then raise exception 'Category not found' using errcode = 'P0002'; end if;
  perform public.normalize_equipment_category_order_v2();
end
$function$;

-- The API cannot expose writes on these SECURITY DEFINER helpers to anonymous users.
revoke all on function public.normalize_equipment_category_order_v2() from public, anon, authenticated;
revoke all on function public.save_equipment_category_v2(uuid,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.set_equipment_category_visibility_v2(uuid,boolean) from public, anon, authenticated;
revoke all on function public.set_equipment_category_position_v2(uuid,integer) from public, anon, authenticated;
revoke all on function public.delete_equipment_category_v2(uuid) from public, anon, authenticated;

grant execute on function public.save_equipment_category_v2(uuid,text,text,text,boolean) to authenticated;
grant execute on function public.set_equipment_category_visibility_v2(uuid,boolean) to authenticated;
grant execute on function public.set_equipment_category_position_v2(uuid,integer) to authenticated;
grant execute on function public.delete_equipment_category_v2(uuid) to authenticated;

commit;
