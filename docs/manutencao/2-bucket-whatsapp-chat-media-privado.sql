-- Bucket whatsapp-chat-media PRIVADO.
-- APLICAR SÓ DEPOIS de publicar o front e as funções desta mesma entrega
-- (o front passa a abrir a mídia com URL assinada; as funções enviam à UaZapi com URL assinada).
-- Reversão: ver bloco comentado no final.

update storage.buckets set public = false where id = 'whatsapp-chat-media';

-- Leitura (gera URL assinada): só quem pode ver o chat daquela loja; pasta master/ só master_admin.
drop policy if exists "Public read whatsapp chat media" on storage.objects;
drop policy if exists "Chat media read by store team or master" on storage.objects;
create policy "Chat media read by store team or master"
on storage.objects for select to authenticated
using (
  bucket_id = 'whatsapp-chat-media'
  and (
    public.is_master_admin()
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (
        public.is_store_admin_of(((storage.foldername(name))[1])::uuid)
        or public.is_attendant_for_store(((storage.foldername(name))[1])::uuid)
      )
    )
  )
);

-- Upload: só na pasta da própria loja (ou master/ para o master).
drop policy if exists "Authenticated users can upload whatsapp media" on storage.objects;
drop policy if exists "Chat media upload by store team or master" on storage.objects;
create policy "Chat media upload by store team or master"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'whatsapp-chat-media'
  and (
    ((storage.foldername(name))[1] = 'master' and public.is_master_admin())
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (
        public.is_store_admin_of(((storage.foldername(name))[1])::uuid)
        or public.is_attendant_for_store(((storage.foldername(name))[1])::uuid)
      )
    )
  )
);

-- Apagar arquivo pelo navegador: só master (a limpeza usa service role).
drop policy if exists "Authenticated users can delete whatsapp media" on storage.objects;
drop policy if exists "Chat media delete by master" on storage.objects;
create policy "Chat media delete by master"
on storage.objects for delete to authenticated
using (bucket_id = 'whatsapp-chat-media' and public.is_master_admin());

-- REVERSÃO (se algo quebrar depois de aplicar):
-- update storage.buckets set public = true where id = 'whatsapp-chat-media';
-- create policy "Public read whatsapp chat media" on storage.objects for select using (bucket_id = 'whatsapp-chat-media');
