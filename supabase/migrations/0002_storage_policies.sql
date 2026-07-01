-- Supabase Storage bucket and policy contract for Sprint 0.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('item-originals', 'item-originals', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('item-processed', 'item-processed', false, 10485760, array['image/png', 'image/webp']),
  ('marketplace-imports', 'marketplace-imports', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('catalog-public', 'catalog-public', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "catalog public read" on storage.objects
  for select using (bucket_id = 'catalog-public');

create policy "avatars owner read" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars owner write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item originals owner read" on storage.objects
  for select using (
    bucket_id = 'item-originals'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item originals owner write" on storage.objects
  for insert with check (
    bucket_id = 'item-originals'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item processed owner read" on storage.objects
  for select using (
    bucket_id = 'item-processed'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item processed owner write" on storage.objects
  for insert with check (
    bucket_id = 'item-processed'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "marketplace imports owner read" on storage.objects
  for select using (
    bucket_id = 'marketplace-imports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "marketplace imports owner write" on storage.objects
  for insert with check (
    bucket_id = 'marketplace-imports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
