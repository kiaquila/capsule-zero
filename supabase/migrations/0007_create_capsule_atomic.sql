-- Create capsules and dependent rows atomically under the service-role provider.

create or replace function public.create_capsule_atomic(
  p_user_id uuid,
  p_name text,
  p_wardrobe_type text,
  p_color_ids text[] default '{}'::text[],
  p_category_targets jsonb default '[]'::jsonb,
  p_wardrobe_entry_ids uuid[] default '{}'::uuid[]
)
returns setof public.capsules
language plpgsql
security definer
set search_path = public
as $$
declare
  written_capsule public.capsules%rowtype;
  requested_color_ids text[] := '{}'::text[];
  requested_item_ids uuid[] := '{}'::uuid[];
  owned_item_count integer := 0;
  item_count integer := 0;
  category_count integer := 0;
  outfit_count integer := 0;
begin
  if p_user_id is null then
    raise exception 'CAPSULE_USER_REQUIRED' using errcode = 'P0001';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'CAPSULE_NAME_REQUIRED' using errcode = 'P0001';
  end if;

  if p_wardrobe_type not in ('women', 'men', 'mixed') then
    raise exception 'CAPSULE_WARDROBE_TYPE_INVALID' using errcode = 'P0001';
  end if;

  if p_category_targets is null or jsonb_typeof(p_category_targets) <> 'array' then
    raise exception 'CAPSULE_CATEGORY_TARGETS_INVALID' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct color_id), '{}'::text[])
    into requested_color_ids
    from unnest(coalesce(p_color_ids, '{}'::text[])) as requested(color_id)
   where color_id is not null
     and length(trim(color_id)) > 0;

  if exists (
    select 1
      from unnest(requested_color_ids) as requested(color_id)
      left join public.color_catalog color_catalog
        on color_catalog.id = requested.color_id
     where color_catalog.id is null
  ) then
    raise exception 'CAPSULE_COLOR_NOT_FOUND' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_category_targets) as target(value)
     where nullif(target.value->>'categoryId', '') is null
        or coalesce(target.value->>'quantity', '') !~ '^[1-9][0-9]*$'
  ) then
    raise exception 'CAPSULE_CATEGORY_TARGETS_INVALID' using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(p_category_targets) as target(value)
      left join public.category_catalog category_catalog
        on category_catalog.id = (target.value->>'categoryId')::uuid
     where category_catalog.id is null
  ) then
    raise exception 'CAPSULE_CATEGORY_NOT_FOUND' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct entry_id), '{}'::uuid[])
    into requested_item_ids
    from unnest(coalesce(p_wardrobe_entry_ids, '{}'::uuid[])) as requested(entry_id)
   where entry_id is not null;

  item_count := coalesce(array_length(requested_item_ids, 1), 0);
  category_count := jsonb_array_length(p_category_targets);
  outfit_count := greatest(item_count * category_count, 0);

  if item_count > 0 then
    select count(*)
      into owned_item_count
      from public.wardrobe_entries wardrobe_entries
     where wardrobe_entries.user_id = p_user_id
       and wardrobe_entries.id = any(requested_item_ids);

    if owned_item_count <> item_count then
      raise exception 'CAPSULE_ITEM_NOT_OWNED' using errcode = '42501';
    end if;
  end if;

  insert into public.capsules (
    user_id,
    name,
    wardrobe_type,
    item_count,
    outfit_count,
    opr
  )
  values (
    p_user_id,
    p_name,
    p_wardrobe_type,
    item_count,
    outfit_count,
    case when item_count > 0 then outfit_count::numeric / item_count else 0 end
  )
  returning *
    into written_capsule;

  insert into public.capsule_palette_colors (
    capsule_id,
    color_id
  )
  select written_capsule.id,
         color_id
    from unnest(requested_color_ids) as requested(color_id);

  insert into public.capsule_category_targets (
    capsule_id,
    category_id,
    quantity
  )
  select written_capsule.id,
         (target.value->>'categoryId')::uuid,
         (target.value->>'quantity')::integer
    from jsonb_array_elements(p_category_targets) as target(value);

  insert into public.capsule_items (
    capsule_id,
    wardrobe_entry_id
  )
  select written_capsule.id,
         entry_id
    from unnest(requested_item_ids) as requested(entry_id);

  return next written_capsule;
end;
$$;

revoke all on function public.create_capsule_atomic(uuid, text, text, text[], jsonb, uuid[]) from public;
revoke all on function public.create_capsule_atomic(uuid, text, text, text[], jsonb, uuid[]) from anon;
revoke all on function public.create_capsule_atomic(uuid, text, text, text[], jsonb, uuid[]) from authenticated;
grant execute on function public.create_capsule_atomic(uuid, text, text, text[], jsonb, uuid[]) to service_role;

notify pgrst, 'reload schema';
