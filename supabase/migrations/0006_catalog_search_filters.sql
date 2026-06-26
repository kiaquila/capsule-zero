create or replace function public.search_catalog_hybrid(query text, filters jsonb)
returns table (item_id uuid, rank real)
language sql
stable
as $$
  -- Contract: args query text, filters jsonb; returns public catalog item ids with rank.
  with normalized as (
    select
      nullif(btrim(query), '') as search_query,
      coalesce(filters, '{}'::jsonb) as search_filters
  ),
  category_filter as (
    select value::uuid as category_id
    from normalized,
      jsonb_array_elements_text(
        coalesce(search_filters->'categoryIds', '[]'::jsonb)
      )
  ),
  color_filter as (
    select value as color_id
    from normalized,
      jsonb_array_elements_text(
        coalesce(search_filters->'colorIds', '[]'::jsonb)
      )
  )
  select items.id, 0::real
  from public.items
    cross join normalized
  where items.visibility = 'public'
    and (
      normalized.search_query is null
      or items.name ilike '%' || normalized.search_query || '%'
    )
    and (
      not exists (select 1 from category_filter)
      or items.category_id in (select category_id from category_filter)
    )
    and (
      not exists (select 1 from color_filter)
      or items.color_ids && array(select color_id from color_filter)
    )
    and (
      normalized.search_filters->>'wardrobeType' is null
      or exists (
        select 1
        from public.category_catalog
        where category_catalog.id = items.category_id
          and (
            (
              normalized.search_filters->>'wardrobeType' = 'mixed'
              and category_catalog.wardrobe_types && array['women', 'men']
            )
            or category_catalog.wardrobe_types @> array[
              normalized.search_filters->>'wardrobeType'
            ]
          )
      )
    )
  limit (
    select coalesce((search_filters->>'limit')::integer, 20)
    from normalized
  );
$$;
