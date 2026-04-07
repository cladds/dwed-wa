-- Create public storage bucket for article images

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "images_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'images');

-- Allow authenticated users to update their uploads
create policy "images_update"
on storage.objects for update
to authenticated
using (bucket_id = 'images');

-- Allow authenticated users to delete images
create policy "images_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'images');

-- Allow public read access to all images
create policy "images_select"
on storage.objects for select
to public
using (bucket_id = 'images');
