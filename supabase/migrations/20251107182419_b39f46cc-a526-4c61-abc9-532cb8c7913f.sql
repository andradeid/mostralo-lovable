-- Criar bucket público para banners de promoção
insert into storage.buckets (id, name, public)
values ('promotion-banners', 'promotion-banners', true);

-- RLS: Donos de loja podem fazer upload de banners
create policy "Donos podem fazer upload de banners"
on storage.objects for insert
with check (
  bucket_id = 'promotion-banners' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- RLS: Donos podem atualizar seus banners
create policy "Donos podem atualizar seus banners"
on storage.objects for update
using (
  bucket_id = 'promotion-banners' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- RLS: Donos podem deletar seus banners
create policy "Donos podem deletar seus banners"
on storage.objects for delete
using (
  bucket_id = 'promotion-banners' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- RLS: Público pode ver banners
create policy "Público pode ver banners"
on storage.objects for select
using (bucket_id = 'promotion-banners');