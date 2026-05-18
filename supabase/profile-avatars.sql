insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_write" on storage.objects;
create policy "avatars_own_write"
  on storage.objects for all
  using (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()))
  with check (bucket_id = 'avatars' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
