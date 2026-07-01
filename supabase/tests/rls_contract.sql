-- Contract test outline for `supabase test db`.
-- Requires Supabase pgTAP helpers in the local stack. These assertions lock the
-- Sprint 0 RLS intent even before route handlers exist.

begin;

select plan(12);

select has_table('public', 'items', 'items table exists');
select has_table('public', 'wardrobe_entries', 'wardrobe entries table exists');
select has_table('public', 'coin_ledger', 'coin ledger table exists');
select has_table('public', 'lava_events', 'lava events table exists');

select policies_are(
  'public',
  'coin_packs',
  array['coin packs read'],
  'coin_packs is client-readable only and never client-writable'
);

select policies_are(
  'public',
  'lava_events',
  array[]::text[],
  'lava_events has no anon/authenticated client policies'
);

select policies_are(
  'public',
  'coin_ledger',
  array['coin ledger owner read'],
  'coin_ledger is client-readable only by owner and never client-writable'
);

select policies_are(
  'public',
  'items',
  array['items owner insert', 'items owner read', 'items owner update', 'items owner delete'],
  'items uses owner plus public catalog read policies'
);

select policies_are(
  'public',
  'wardrobe_entries',
  array['wardrobe owner all'],
  'wardrobe_entries owns per-user item state'
);

select has_function(
  'public',
  'validate_palette',
  array['text[]'],
  'palette validation RPC exists'
);

select has_function(
  'public',
  'search_catalog_hybrid',
  array['text', 'jsonb'],
  'hybrid catalog search RPC exists'
);

select has_function(
  'public',
  'regenerate_capsule_outputs',
  array['uuid'],
  'capsule recompute RPC exists'
);

select * from finish();

rollback;
