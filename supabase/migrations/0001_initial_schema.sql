-- Capsule Zero Sprint 0 initial schema contract.
-- Applies the two-table item ownership model:
--   items.visibility controls shared catalog exposure.
--   wardrobe_entries.user_id controls each user's relationship and status.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_asset_id uuid,
  language text not null default 'en' check (language in ('en', 'es-AR', 'ru')),
  country text,
  city text,
  coin_balance integer not null default 0 check (coin_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coin_packs (
  id text primary key check (id in ('coins_5', 'coins_15', 'coins_30')),
  coins integer not null check (coins > 0),
  provider text not null default 'lava_top',
  provider_product_id text,
  active boolean not null default true
);

create table public.lava_events (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  lava_invoice_id text,
  event_type text not null,
  payload_hash text not null,
  payload jsonb not null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create table public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lava_event_id text references public.lava_events(id) on delete restrict,
  amount integer not null check (amount <> 0),
  reason text not null check (
    reason in ('purchase', 'refund', 'extra_capsule', 'photo_enhancement', 'admin_adjustment')
  ),
  target_id uuid,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.color_catalog (
  id text primary key,
  name text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  color_group text not null check (
    color_group in ('achromatic', 'bright', 'pastel', 'desaturated', 'dark')
  ),
  sort_order integer not null
);

create table public.compatibility_rules (
  left_group text not null,
  right_group text not null,
  compatible boolean not null,
  primary key (left_group, right_group)
);

create table public.category_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ru text,
  wardrobe_types text[] not null,
  layer text not null check (
    layer in ('tops', 'dresses_skirts', 'bottoms', 'outerwear', 'shoes', 'bags', 'accessories')
  ),
  description text,
  sort_order integer not null
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  category_id uuid not null references public.category_catalog(id),
  color_ids text[] not null,
  brand text,
  material text,
  price numeric(10, 2),
  source_url text,
  source_type text not null check (source_type in ('photo_upload', 'marketplace', 'catalog')),
  visibility text not null default 'private'
    check (visibility in ('private', 'moderation_pending', 'public')),
  moderation_status text not null default 'none'
    check (moderation_status in ('none', 'pending', 'approved', 'rejected')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wardrobe_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'uncapsulated', 'for_sale', 'for_repair')),
  favorite boolean not null default false,
  from_catalog boolean not null default false,
  user_name_override text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table public.item_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  bucket text not null,
  object_path text not null,
  variant text not null check (
    variant in ('avatar', 'original', 'processed', 'thumbnail', 'marketplace', 'catalog')
  ),
  mime_type text,
  width integer,
  height integer,
  checksum text,
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table public.upload_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_asset_id uuid references public.item_assets(id) on delete set null,
  job_type text not null check (
    job_type in ('photo_upload', 'background_removal', 'marketplace_parse', 'item_embedding')
  ),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'retryable')),
  provider text,
  duration_ms integer,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  urls text[] not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'retryable')),
  candidates jsonb not null default '[]'::jsonb,
  confirmed_item_id uuid references public.items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.item_embeddings (
  item_id uuid primary key references public.items(id) on delete cascade,
  embedding vector(1536),
  searchable_text text not null,
  updated_at timestamptz not null default now()
);

create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  wardrobe_type text not null check (wardrobe_type in ('women', 'men', 'mixed')),
  palette_locked boolean not null default true,
  item_count integer not null default 0 check (item_count >= 0),
  outfit_count integer not null default 0 check (outfit_count >= 0),
  opr numeric(8, 2) not null default 0 check (opr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capsule_palette_colors (
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  color_id text not null references public.color_catalog(id),
  primary key (capsule_id, color_id)
);

create table public.capsule_category_targets (
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  category_id uuid not null references public.category_catalog(id),
  quantity integer not null check (quantity > 0),
  primary key (capsule_id, category_id)
);

create table public.capsule_items (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  wardrobe_entry_id uuid not null references public.wardrobe_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (capsule_id, wardrobe_entry_id)
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  wardrobe_entry_id uuid not null references public.wardrobe_entries(id) on delete cascade,
  layer text not null,
  primary key (outfit_id, wardrobe_entry_id)
);

create table public.gap_recommendations (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  category_id uuid not null references public.category_catalog(id),
  color_ids text[] not null default '{}'::text[],
  priority text not null check (priority in ('high', 'medium', 'low')),
  impact numeric(8, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_avatar_asset_fk
  foreign key (avatar_asset_id) references public.item_assets(id) on delete set null;

create index items_visibility_idx on public.items(visibility);
create index items_owner_idx on public.items(owner_user_id);
create index wardrobe_entries_user_status_idx on public.wardrobe_entries(user_id, status);
create index item_assets_user_idx on public.item_assets(user_id);
create index upload_jobs_user_status_idx on public.upload_jobs(user_id, status);
create index capsules_user_idx on public.capsules(user_id);
create index coin_ledger_user_created_idx on public.coin_ledger(user_id, created_at desc);
create index lava_events_invoice_idx on public.lava_events(lava_invoice_id);
create index item_embeddings_vector_idx on public.item_embeddings using ivfflat (embedding vector_cosine_ops);
create index item_embeddings_text_idx on public.item_embeddings using gin (to_tsvector('simple', searchable_text));

insert into public.coin_packs (id, coins) values
  ('coins_5', 5),
  ('coins_15', 15),
  ('coins_30', 30)
on conflict (id) do nothing;

insert into public.color_catalog (id, name, hex, color_group, sort_order) values
  ('A1', 'Black', '#1C1C1C', 'achromatic', 1),
  ('A2', 'Gray', '#8C8C8C', 'achromatic', 2),
  ('A3', 'White', '#F0F0F0', 'achromatic', 3),
  ('B1', 'Scarlet', '#E82535', 'bright', 11),
  ('B2', 'Vermillion', '#E84B20', 'bright', 12),
  ('B3', 'Tangerine', '#E87820', 'bright', 13),
  ('B4', 'Amber', '#E8AA20', 'bright', 14),
  ('B5', 'Canary', '#E8D520', 'bright', 15),
  ('B6', 'Chartreuse', '#7EC820', 'bright', 16),
  ('B7', 'Emerald', '#20A84E', 'bright', 17),
  ('B8', 'Teal', '#10A896', 'bright', 18),
  ('B9', 'Cobalt', '#186AE8', 'bright', 19),
  ('B10', 'Indigo', '#3828E8', 'bright', 20),
  ('B11', 'Violet', '#8820E8', 'bright', 21),
  ('B12', 'Fuchsia', '#D020AA', 'bright', 22),
  ('P1', 'Blush', '#F5B5BB', 'pastel', 31),
  ('P2', 'Peach', '#F5C5B0', 'pastel', 32),
  ('P3', 'Apricot', '#F5D5B0', 'pastel', 33),
  ('P4', 'Beige', '#E8D5B5', 'pastel', 34),
  ('P5', 'Off-white', '#FAF0E6', 'pastel', 35),
  ('P6', 'Pale Lime', '#DCEEB0', 'pastel', 36),
  ('P7', 'Mint', '#B0EEC5', 'pastel', 37),
  ('P8', 'Aqua', '#B0EEDE', 'pastel', 38),
  ('P9', 'Sky', '#B0CDEE', 'pastel', 39),
  ('P10', 'Periwinkle', '#C0B8EE', 'pastel', 40),
  ('P11', 'Lavender', '#DCB8EE', 'pastel', 41),
  ('P12', 'Orchid', '#EEB8E5', 'pastel', 42),
  ('D1', 'Brick', '#B86068', 'desaturated', 51),
  ('D2', 'Coral', '#C07860', 'desaturated', 52),
  ('D3', 'Terracotta', '#C08A65', 'desaturated', 53),
  ('D4', 'Sand', '#C0A268', 'desaturated', 54),
  ('D5', 'Straw', '#B8B268', 'desaturated', 55),
  ('D6', 'Sage', '#88A865', 'desaturated', 56),
  ('D7', 'Fern', '#60A878', 'desaturated', 57),
  ('D8', 'Dusty Teal', '#50A095', 'desaturated', 58),
  ('D9', 'Slate', '#5082B8', 'desaturated', 59),
  ('D10', 'Dusty Indigo', '#6860B8', 'desaturated', 60),
  ('D11', 'Mauve', '#9860B8', 'desaturated', 61),
  ('D12', 'Antique Rose', '#B860A2', 'desaturated', 62),
  ('K1', 'Burgundy', '#8C1820', 'dark', 71),
  ('K2', 'Rust', '#8C3015', 'dark', 72),
  ('K3', 'Burnt Orange', '#8C5018', 'dark', 73),
  ('K4', 'Ochre', '#8C6C15', 'dark', 74),
  ('K5', 'Olive Gold', '#787815', 'dark', 75),
  ('K6', 'Olive', '#4A7A18', 'dark', 76),
  ('K7', 'Forest', '#187838', 'dark', 77),
  ('K8', 'Pine', '#187870', 'dark', 78),
  ('K9', 'Navy', '#182878', 'dark', 79),
  ('K10', 'Midnight', '#201878', 'dark', 80),
  ('K11', 'Plum', '#5A1878', 'dark', 81),
  ('K12', 'Mulberry', '#781860', 'dark', 82)
on conflict (id) do nothing;

insert into public.compatibility_rules (left_group, right_group, compatible) values
  ('achromatic', 'achromatic', true),
  ('achromatic', 'bright', true),
  ('achromatic', 'pastel', true),
  ('achromatic', 'desaturated', true),
  ('achromatic', 'dark', true),
  ('bright', 'achromatic', true),
  ('bright', 'bright', true),
  ('bright', 'pastel', false),
  ('bright', 'desaturated', false),
  ('bright', 'dark', false),
  ('pastel', 'achromatic', true),
  ('pastel', 'bright', false),
  ('pastel', 'pastel', true),
  ('pastel', 'desaturated', false),
  ('pastel', 'dark', false),
  ('desaturated', 'achromatic', true),
  ('desaturated', 'bright', false),
  ('desaturated', 'pastel', false),
  ('desaturated', 'desaturated', true),
  ('desaturated', 'dark', true),
  ('dark', 'achromatic', true),
  ('dark', 'bright', false),
  ('dark', 'pastel', false),
  ('dark', 'desaturated', true),
  ('dark', 'dark', true)
on conflict (left_group, right_group) do nothing;

insert into public.category_catalog
  (slug, name_en, name_ru, wardrobe_types, layer, description, sort_order)
values
  ('tank-top-cami', 'Tank top / Cami', 'Maika-top', '{women,men}', 'tops', 'Basic layer, round or V-neck', 1),
  ('button-down-shirt', 'Button-down shirt', 'Bluzka-rubashka', '{women,men}', 'tops', 'Classic collar, solid color', 2),
  ('turtleneck', 'Turtleneck', 'Vodolazka', '{women,men}', 'tops', 'Slim fit, fine knit', 3),
  ('crew-neck-sweater', 'Crew neck sweater', 'Dzhemper', '{women,men}', 'tops', 'Thin/medium knit, round neck', 4),
  ('cardigan', 'Cardigan', 'Kardigan', '{women,men}', 'tops', 'Open-front or buttoned', 5),
  ('blazer', 'Blazer', 'Pidzhak', '{women,men}', 'tops', 'Structured or relaxed', 6),
  ('t-shirt', 'T-shirt', 'Futbolka', '{women,men}', 'tops', 'Round or V-neck, basic fit', 7),
  ('hoodie-sweatshirt', 'Hoodie / Sweatshirt', 'Hudi, svitshot', '{women,men}', 'tops', 'Basic cut', 8),
  ('dress', 'Dress', 'Plate', '{women}', 'dresses_skirts', 'Shift, A-line, or wrap', 20),
  ('skirt', 'Skirt', 'Yubka', '{women}', 'dresses_skirts', 'Pencil, A-line, or midi', 21),
  ('trousers', 'Trousers', 'Bryuki', '{women,men}', 'bottoms', 'Classic, straight, or wide leg', 30),
  ('jeans', 'Jeans', 'Dzhinsy', '{women,men}', 'bottoms', 'Straight, slim, or relaxed', 31),
  ('shorts', 'Shorts', 'Shorty', '{women,men}', 'bottoms', 'Classic, bermuda', 32),
  ('chinos', 'Chinos', 'Chinos', '{men}', 'bottoms', 'Slim or straight, cotton twill', 33),
  ('trench-coat', 'Trench coat', 'Plashch', '{women,men}', 'outerwear', 'Classic, with belt', 40),
  ('coat', 'Coat', 'Palto', '{women,men}', 'outerwear', 'Mid-to-long, wool/cashmere', 41),
  ('puffer-jacket', 'Puffer jacket', 'Pukhovik', '{women,men}', 'outerwear', 'Light/medium, clean silhouette', 42),
  ('jacket', 'Jacket', 'Kurtka', '{women,men}', 'outerwear', 'Leather, denim, or utility', 43),
  ('sandals', 'Sandals', 'Sandalii', '{women,men}', 'shoes', 'Flat or low heel', 50),
  ('pumps-dress-shoes', 'Pumps / Dress shoes', 'Tufli', '{women,men}', 'shoes', 'Heels, oxford, or derby', 51),
  ('ankle-boots', 'Ankle boots', 'Botilony', '{women,men}', 'shoes', 'Low-to-mid heel', 52),
  ('sneakers', 'Sneakers', 'Krossovki/kedy', '{women,men}', 'shoes', 'Clean, minimal design', 53),
  ('loafers', 'Loafers', 'Lofery', '{women,men}', 'shoes', 'Classic penny or bit', 54),
  ('tote-bag', 'Tote bag', 'Sumka-shopper', '{women,men}', 'bags', 'Large, everyday', 60),
  ('crossbody-bag', 'Crossbody bag', 'Sumka-krossbodi', '{women,men}', 'bags', 'Small-to-medium', 61),
  ('backpack', 'Backpack', 'Ryukzak', '{women,men}', 'bags', 'Clean lines, leather or canvas', 62),
  ('scarf', 'Scarf', 'Sharf', '{women,men}', 'accessories', 'Wool, cashmere, or silk', 70),
  ('belt', 'Belt', 'Remen', '{women,men}', 'accessories', 'Leather, classic buckle', 71),
  ('sunglasses', 'Sunglasses', 'Ochki', '{women,men}', 'accessories', 'Wayfarer, aviator, or round', 72),
  ('watch', 'Watch', 'Chasy', '{women,men}', 'accessories', 'Clean dial', 73)
on conflict (slug) do nothing;

alter table public.profiles enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.lava_events enable row level security;
alter table public.color_catalog enable row level security;
alter table public.compatibility_rules enable row level security;
alter table public.category_catalog enable row level security;
alter table public.items enable row level security;
alter table public.wardrobe_entries enable row level security;
alter table public.item_assets enable row level security;
alter table public.upload_jobs enable row level security;
alter table public.marketplace_imports enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.item_embeddings enable row level security;
alter table public.capsules enable row level security;
alter table public.capsule_palette_colors enable row level security;
alter table public.capsule_category_targets enable row level security;
alter table public.capsule_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.gap_recommendations enable row level security;

create policy "profiles owner read" on public.profiles
  for select using (user_id = auth.uid());
create policy "profiles owner insert" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles owner update" on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "coin ledger owner read" on public.coin_ledger
  for select using (user_id = auth.uid());

create policy "methodology colors read" on public.color_catalog
  for select to authenticated using (true);
create policy "methodology compatibility read" on public.compatibility_rules
  for select to authenticated using (true);
create policy "methodology categories read" on public.category_catalog
  for select to authenticated using (true);

create policy "items owner insert" on public.items
  for insert with check (owner_user_id = auth.uid());
create policy "items owner read" on public.items
  for select using (owner_user_id = auth.uid() or visibility = 'public');
create policy "items owner update" on public.items
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "items owner delete" on public.items
  for delete using (owner_user_id = auth.uid() and visibility <> 'public');

create policy "wardrobe owner all" on public.wardrobe_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "assets owner all" on public.item_assets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "catalog assets read" on public.item_assets
  for select using (bucket = 'catalog-public');

create policy "upload jobs owner all" on public.upload_jobs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "marketplace imports owner all" on public.marketplace_imports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "public item embeddings read" on public.item_embeddings
  for select using (
    exists (
      select 1 from public.items
      where items.id = item_embeddings.item_id and items.visibility = 'public'
    )
  );

create policy "capsules owner all" on public.capsules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "capsule palette owner read" on public.capsule_palette_colors
  for select using (
    exists (
      select 1 from public.capsules
      where capsules.id = capsule_palette_colors.capsule_id
        and capsules.user_id = auth.uid()
    )
  );
create policy "capsule targets owner read" on public.capsule_category_targets
  for select using (
    exists (
      select 1 from public.capsules
      where capsules.id = capsule_category_targets.capsule_id
        and capsules.user_id = auth.uid()
    )
  );
create policy "capsule items owner read" on public.capsule_items
  for select using (
    exists (
      select 1 from public.capsules
      where capsules.id = capsule_items.capsule_id
        and capsules.user_id = auth.uid()
    )
  );
create policy "outfits owner read" on public.outfits
  for select using (
    exists (
      select 1 from public.capsules
      where capsules.id = outfits.capsule_id
        and capsules.user_id = auth.uid()
    )
  );
create policy "outfit items owner read" on public.outfit_items
  for select using (
    exists (
      select 1 from public.outfits
      join public.capsules on capsules.id = outfits.capsule_id
      where outfits.id = outfit_items.outfit_id
        and capsules.user_id = auth.uid()
    )
  );
create policy "gap recommendations owner read" on public.gap_recommendations
  for select using (
    exists (
      select 1 from public.capsules
      where capsules.id = gap_recommendations.capsule_id
        and capsules.user_id = auth.uid()
    )
  );

-- No anon/authenticated policies are created for lava_events or moderation_queue.
-- They are server-only surfaces accessed through Route Handlers or Edge Functions
-- with service-role credentials.

create or replace function public.validate_palette(color_ids text[])
returns jsonb
language plpgsql
stable
as $$
declare
  incompatible_count integer;
begin
  -- Contract: args color_ids text[]; returns { compatible, blockedColorIds, explanation }.
  with selected as (
    select distinct color_group from public.color_catalog where id = any(color_ids)
  ),
  pairs as (
    select left_group.color_group as left_group, right_group.color_group as right_group
    from selected left_group cross join selected right_group
  )
  select count(*)
  into incompatible_count
  from pairs
  left join public.compatibility_rules rules
    on rules.left_group = pairs.left_group
   and rules.right_group = pairs.right_group
  where coalesce(rules.compatible, false) = false;

  return jsonb_build_object(
    'compatible', incompatible_count = 0,
    'blockedColorIds', '[]'::jsonb,
    'explanation', case
      when incompatible_count = 0 then null
      else 'Selected colors cross incompatible Capsule Zero color groups.'
    end
  );
end;
$$;

create or replace function public.validate_item_for_capsule(item_id uuid, capsule_id uuid)
returns jsonb
language plpgsql
stable
as $$
begin
  -- Contract: args item_id uuid, capsule_id uuid; returns { compatible, explanation }.
  return jsonb_build_object('compatible', true, 'explanation', null);
end;
$$;

create or replace function public.regenerate_capsule_outputs(capsule_id uuid)
returns jsonb
language plpgsql
volatile
as $$
begin
  -- Contract: args capsule_id uuid; returns { capsuleId, outfitCount, opr, gapCount }.
  return jsonb_build_object('capsuleId', capsule_id, 'outfitCount', 0, 'opr', 0, 'gapCount', 0);
end;
$$;

create or replace function public.search_catalog_hybrid(query text, filters jsonb)
returns table (item_id uuid, rank real)
language sql
stable
as $$
  -- Contract: args query text, filters jsonb; returns public catalog item ids with rank.
  select items.id, 0::real
  from public.items
  where items.visibility = 'public'
    and (
      query is null
      or items.name ilike '%' || query || '%'
    )
  limit coalesce((filters->>'limit')::integer, 20);
$$;

create or replace function public.queue_item_embedding(item_id uuid)
returns uuid
language sql
volatile
as $$
  -- Contract: args item_id uuid; returns upload_jobs.id for embedding work.
  insert into public.upload_jobs (user_id, job_type, status, payload)
  select owner_user_id, 'item_embedding', 'queued', jsonb_build_object('itemId', item_id)
  from public.items
  where id = item_id and owner_user_id is not null
  returning id;
$$;
