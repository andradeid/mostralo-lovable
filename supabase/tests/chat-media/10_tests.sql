-- Testes locais: funções de retenção e políticas do bucket privado.
\set ON_ERROR_STOP on
-- Dados: loja A (dono uA), loja B (dono uB), atendente de A (uAt), master (uM), anônimo.
insert into profiles values ('00000000-0000-0000-0000-0000000000a1','store_admin'),('00000000-0000-0000-0000-0000000000b1','store_admin'),('00000000-0000-0000-0000-0000000000c1','attendant'),('00000000-0000-0000-0000-0000000000d1','master_admin');
insert into stores values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Loja A','00000000-0000-0000-0000-0000000000a1',false),
                          ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Loja B','00000000-0000-0000-0000-0000000000b1',true);
insert into user_roles values ('00000000-0000-0000-0000-0000000000c1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','attendant');
insert into storage.objects (bucket_id, name, metadata, created_at) values
 ('whatsapp-chat-media','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/1_old.jpg','{"size":1000}', now()-interval '40 days'),
 ('whatsapp-chat-media','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/2_new.jpg','{"size":2000}', now()-interval '2 days'),
 ('whatsapp-chat-media','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/5561888/3_old.mp3','{"size":3000}', now()-interval '90 days'),
 ('whatsapp-chat-media','master/5561777/4_old.mp4','{"size":4000}', now()-interval '35 days'),
 ('outro-bucket','x/5_old.jpg','{"size":9}', now()-interval '99 days');
insert into whatsapp_chat_messages (store_id, media_url, metadata) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','https://x.supabase.co/storage/v1/object/public/whatsapp-chat-media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/1_old.jpg', '{"transcription":"oi"}'),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','https://x.supabase.co/storage/v1/object/public/whatsapp-chat-media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/2_new.jpg', null),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','https://outro.cdn/foto.jpg', null);
insert into master_whatsapp_chat_messages (media_url, metadata) values
 ('https://x.supabase.co/storage/v1/object/public/whatsapp-chat-media/master/5561777/4_old.mp4', null);

do $$ declare n int; r record; begin
  -- chat_media_list_objects: só o bucket certo, filtro de idade e prefixo, paginação
  select count(*) into n from public.chat_media_list_objects(null, now()-interval '30 days', 500, null);
  assert n = 3, 'antigos (>30d) no bucket = 3, veio ' || n;
  select count(*) into n from public.chat_media_list_objects('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/', null, 500, null);
  assert n = 2, 'prefixo loja A = 2, veio ' || n;
  select count(*) into n from public.chat_media_list_objects(null, null, 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/2_new.jpg');
  assert n = 1, 'paginação depois do nome = 1, veio ' || n;
  -- chat_media_summary
  select * into r from public.chat_media_summary(now()-interval '30 days') where folder = 'master';
  assert r.files = 1 and r.old_files = 1 and r.old_bytes = 4000, 'resumo master errado';
  -- chat_media_mark_expired
  select public.chat_media_mark_expired(array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/5561999/1_old.jpg','master/5561777/4_old.mp4']) into n;
  assert n = 2, 'mark_expired deve mudar 2 mensagens, veio ' || n;
  select count(*) into n from whatsapp_chat_messages where media_url is null and metadata->>'media_expired' = 'true' and metadata->>'transcription' = 'oi';
  assert n = 1, 'mensagem da loja expirada mantendo a transcrição';
  select count(*) into n from whatsapp_chat_messages where media_url like '%2_new.jpg' or media_url = 'https://outro.cdn/foto.jpg';
  assert n = 2, 'mensagens recentes/de fora intactas';
  select count(*) into n from master_whatsapp_chat_messages where media_url is null and metadata->>'media_expired' = 'true';
  assert n = 1, 'mensagem master expirada';
  select public.chat_media_mark_expired(array[]::text[]) into n; assert n = 0, 'array vazio';
  raise notice 'OK funções de retenção';
end $$;

-- Permissões das funções: anon/authenticated não executam
do $$ begin
  assert not has_function_privilege('anon', 'public.chat_media_list_objects(text,timestamptz,int,text)', 'execute'), 'anon não pode listar';
  assert not has_function_privilege('authenticated', 'public.chat_media_mark_expired(text[])', 'execute'), 'authenticated não pode marcar';
  assert has_function_privilege('service_role', 'public.chat_media_summary(timestamptz)', 'execute'), 'service_role pode resumir';
  raise notice 'OK permissões das funções';
end $$;
