-- Testes das políticas depois de aplicar docs/manutencao/2-bucket-whatsapp-chat-media-privado.sql
\set ON_ERROR_STOP on
create or replace function pg_temp.visible(_uid text, _role text) returns setof text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(_uid,''), true);
  perform set_config('request.jwt.claim.role', _role, true);
  execute format('set local role %I', _role);
  return query select name from storage.objects where bucket_id='whatsapp-chat-media' order by name;
  reset role;
end $$;

begin;
do $$ declare n int; begin
  assert (select not public from storage.buckets where id='whatsapp-chat-media'), 'bucket deve ficar privado';
end $$;
-- anônimo: não vê nada
select set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claim.role','anon',true);
set local role anon;
do $$ declare n int; begin select count(*) into n from storage.objects where bucket_id='whatsapp-chat-media'; assert n = 0, 'anon vê ' || n; end $$;
reset role;
-- dono da loja A: só a pasta da loja A
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',true), set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$ declare n int; m int; begin
  select count(*) into n from storage.objects where bucket_id='whatsapp-chat-media';
  select count(*) into m from storage.objects where bucket_id='whatsapp-chat-media' and name like 'aaaaaaaa-%';
  assert n = 2 and m = 2, 'dono A deveria ver só os 2 da loja A, viu ' || n;
end $$;
-- upload na própria pasta ok; na pasta da loja B e em master/ bloqueado
insert into storage.objects (bucket_id, name, metadata) values ('whatsapp-chat-media','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/novo.jpg','{"size":1}');
do $$ begin
  begin insert into storage.objects (bucket_id, name) values ('whatsapp-chat-media','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/x.jpg'); raise exception 'upload em B deveria falhar';
  exception when insufficient_privilege then null; end;
  begin insert into storage.objects (bucket_id, name) values ('whatsapp-chat-media','master/x.jpg'); raise exception 'upload em master/ deveria falhar';
  exception when insufficient_privilege then null; end;
end $$;
-- apagar pelo navegador: lojista não apaga
do $$ declare n int; begin
  delete from storage.objects where bucket_id='whatsapp-chat-media' and name like 'aaaaaaaa-%';
  get diagnostics n = row_count; assert n = 0, 'lojista não deveria apagar, apagou ' || n;
end $$;
reset role;
-- atendente da loja A: vê A
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',true);
set local role authenticated;
do $$ declare n int; begin select count(*) into n from storage.objects where bucket_id='whatsapp-chat-media' and name not like 'aaaaaaaa-%'; assert n = 0, 'atendente vê fora da loja'; 
  select count(*) into n from storage.objects where bucket_id='whatsapp-chat-media'; assert n = 3, 'atendente deveria ver 3 (2 + novo), viu ' || n; end $$;
reset role;
-- master: vê tudo, sobe em master/
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000d1',true);
set local role authenticated;
do $$ declare n int; begin select count(*) into n from storage.objects where bucket_id='whatsapp-chat-media'; assert n = 5, 'master deveria ver 5, viu ' || n; end $$;
insert into storage.objects (bucket_id, name) values ('whatsapp-chat-media','master/enviado.jpg');
reset role;
rollback;
do $$ begin raise notice 'OK políticas do bucket privado'; end $$;
