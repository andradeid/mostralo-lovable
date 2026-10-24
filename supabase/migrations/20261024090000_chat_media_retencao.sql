-- Mídia do chat de WhatsApp (bucket whatsapp-chat-media): funções de apoio para a limpeza
-- apagar os ARQUIVOS junto com as mensagens e aplicar a retenção (padrão 30 dias).
-- Aditivo: só cria funções (service role). Não apaga nada sozinho.

-- Lista objetos do bucket por prefixo e/ou idade, paginado por nome.
create or replace function public.chat_media_list_objects(
  p_prefix text default null,
  p_before timestamptz default null,
  p_limit int default 500,
  p_after_name text default null
)
returns table(name text, size bigint, created_at timestamptz)
language sql
stable
security definer
set search_path = storage, public
as $$
  select o.name, coalesce((o.metadata->>'size')::bigint, 0) as size, o.created_at
  from storage.objects o
  where o.bucket_id = 'whatsapp-chat-media'
    and (p_prefix is null or o.name like p_prefix || '%')
    and (p_before is null or o.created_at < p_before)
    and (p_after_name is null or o.name > p_after_name)
  order by o.name
  limit least(greatest(coalesce(p_limit, 500), 1), 1000)
$$;

-- Resumo por pasta de topo (loja / master): quantidade e tamanho, total e antigos.
create or replace function public.chat_media_summary(p_before timestamptz default null)
returns table(folder text, files bigint, bytes bigint, old_files bigint, old_bytes bigint)
language sql
stable
security definer
set search_path = storage, public
as $$
  select split_part(o.name, '/', 1) as folder,
         count(*) as files,
         coalesce(sum((o.metadata->>'size')::bigint), 0) as bytes,
         count(*) filter (where p_before is not null and o.created_at < p_before) as old_files,
         coalesce(sum((o.metadata->>'size')::bigint) filter (where p_before is not null and o.created_at < p_before), 0) as old_bytes
  from storage.objects o
  where o.bucket_id = 'whatsapp-chat-media'
  group by 1
  order by 3 desc
$$;

-- Marca como expirada a mídia das mensagens cujos arquivos vão ser apagados
-- (o chat mostra "mídia expirada" em vez de imagem quebrada). Devolve quantas mensagens mudaram.
create or replace function public.chat_media_mark_expired(p_paths text[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  _n int := 0;
  _m int := 0;
begin
  if p_paths is null or array_length(p_paths, 1) is null then
    return 0;
  end if;

  update public.whatsapp_chat_messages
     set media_url = null,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('media_expired', true)
   where media_url is not null
     and substring(media_url from '/whatsapp-chat-media/([^?#]+)') = any(p_paths);
  get diagnostics _n = row_count;

  update public.master_whatsapp_chat_messages
     set media_url = null,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('media_expired', true)
   where media_url is not null
     and substring(media_url from '/whatsapp-chat-media/([^?#]+)') = any(p_paths);
  get diagnostics _m = row_count;

  return _n + _m;
end;
$$;

revoke all on function public.chat_media_list_objects(text, timestamptz, int, text) from public, anon, authenticated;
revoke all on function public.chat_media_summary(timestamptz) from public, anon, authenticated;
revoke all on function public.chat_media_mark_expired(text[]) from public, anon, authenticated;
grant execute on function public.chat_media_list_objects(text, timestamptz, int, text) to service_role;
grant execute on function public.chat_media_summary(timestamptz) to service_role;
grant execute on function public.chat_media_mark_expired(text[]) to service_role;

-- Histórico da limpeza passa a registrar arquivos apagados e espaço liberado.
alter table public.whatsapp_cleanup_log add column if not exists deleted_files bigint not null default 0;
alter table public.whatsapp_cleanup_log add column if not exists freed_bytes bigint not null default 0;
