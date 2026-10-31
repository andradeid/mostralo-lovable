-- Mídia das conversas de WhatsApp: bucket privado. Leitura (link assinado) só da equipe da loja e do master;
-- upload só na pasta da própria loja; apagar pelo navegador só o master. Front e funções já usam link assinado.
-- Reversão: update storage.buckets set public = true where id = 'whatsapp-chat-media';

update storage.buckets set public = false where id = 'whatsapp-chat-media';

-- Leitura (gera URL assinada): só quem pode ver o chat daquela loja; pasta master/ só master_admin.
alter policy "Public read whatsapp chat media" on storage.objects to service_role;
create policy "Chat media read by store team or master"
on storage.objects for select to authenticated
using (
  bucket_id = 'whatsapp-chat-media'
  and (
    public.is_master_admin()
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (
        public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
        or public.is_attendant_for_store((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
      )
    )
  )
);

-- Upload: só na pasta da própria loja (ou master/ para o master).
alter policy "Authenticated users can upload whatsapp media" on storage.objects to service_role;
create policy "Chat media upload by store team or master"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'whatsapp-chat-media'
  and (
    ((storage.foldername(name))[1] = 'master' and public.is_master_admin())
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (
        public.is_store_admin_of((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
        or public.is_attendant_for_store((case when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then ((storage.foldername(name))[1])::uuid end))
      )
    )
  )
);

-- Apagar arquivo pelo navegador: só master (a limpeza usa service role).
alter policy "Authenticated users can delete whatsapp media" on storage.objects to service_role;
create policy "Chat media delete by master"
on storage.objects for delete to authenticated
using (bucket_id = 'whatsapp-chat-media' and public.is_master_admin());

