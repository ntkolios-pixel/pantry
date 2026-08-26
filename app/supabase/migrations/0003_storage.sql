-- Storage bucket for recipe photos (the "Add a photo" import method). Each
-- user's uploads live under a `${auth.uid()}/...` prefix, which the policies
-- below use to scope read/write access the same way RLS does for tables.
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', false)
on conflict (id) do nothing;

create policy "recipe photos: owner can read"
  on storage.objects for select
  using (bucket_id = 'recipe-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "recipe photos: owner can upload"
  on storage.objects for insert
  with check (bucket_id = 'recipe-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "recipe photos: owner can delete"
  on storage.objects for delete
  using (bucket_id = 'recipe-photos' and auth.uid()::text = (storage.foldername(name))[1]);
