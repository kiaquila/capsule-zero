-- Align the persisted Supabase schema with the production provider contract.

alter table public.upload_jobs
  drop constraint if exists upload_jobs_status_check;

alter table public.upload_jobs
  add constraint upload_jobs_status_check
  check (
    status in (
      'queued',
      'processing',
      'succeeded',
      'completed',
      'failed',
      'timeout',
      'retryable'
    )
  );

alter table public.marketplace_imports
  drop constraint if exists marketplace_imports_status_check;

alter table public.marketplace_imports
  add constraint marketplace_imports_status_check
  check (
    status in (
      'queued',
      'processing',
      'completed',
      'failed',
      'retryable',
      'confirmed'
    )
  );

alter table public.coin_packs
  add column if not exists price_usd numeric(10, 2);

update public.coin_packs
set price_usd = case id
  when 'coins_5' then 5
  when 'coins_15' then 12
  when 'coins_30' then 20
  else price_usd
end
where price_usd is null;

create table if not exists public.lava_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_pack_id text not null references public.coin_packs(id) on delete restrict,
  lava_invoice_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'failed')),
  payment_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lava_invoices enable row level security;

drop policy if exists "lava invoices owner read" on public.lava_invoices;
create policy "lava invoices owner read" on public.lava_invoices
  for select using (user_id = auth.uid());

-- Server-side route handlers use service-role credentials for invoice writes.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email)
  )
  on conflict (user_id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

insert into public.items
  (name, category_id, color_ids, brand, material, price, source_type, visibility, moderation_status)
select seed.name,
       category_catalog.id,
       seed.color_ids,
       seed.brand,
       seed.material,
       seed.price,
       'catalog',
       'public',
       'approved'
from (
  values
    ('White cotton shirt', 'button-down-shirt', array['A3', 'A2']::text[], 'Capsule Zero', 'Organic cotton', 89.00),
    ('Black straight trousers', 'trousers', array['A1']::text[], 'Capsule Zero', 'Wool blend', 120.00),
    ('Navy wool coat', 'coat', array['K9', 'A1']::text[], 'Capsule Zero', 'Wool', 260.00),
    ('Grey leather sneakers', 'sneakers', array['A2', 'A3']::text[], 'Capsule Zero', 'Leather', 140.00),
    ('Tan tote bag', 'tote-bag', array['D4']::text[], 'Capsule Zero', 'Leather', 180.00)
) as seed(name, slug, color_ids, brand, material, price)
join public.category_catalog on category_catalog.slug = seed.slug
where not exists (
  select 1
  from public.items existing
  where existing.name = seed.name
    and existing.source_type = 'catalog'
    and existing.visibility = 'public'
);

grant all on public.lava_invoices to anon, authenticated, service_role;
grant execute on function public.handle_new_user_profile() to service_role;
