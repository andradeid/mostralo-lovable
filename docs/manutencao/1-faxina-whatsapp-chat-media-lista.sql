-- Só LEITURA: o que a faxina do bucket whatsapp-chat-media vai apagar (rodar no SQL Editor do Supabase).
-- Critério: arquivos de loja SEM Central (qualquer idade) + arquivos com mais de 30 dias (inclui master/).
-- Lojas com "manter histórico" (stores.retain_whatsapp_history) ficam de fora.
with sem_central as (select store_id::text as pasta, store_name from public.get_stores_without_chat_module()),
manter as (select id::text as pasta from public.stores where retain_whatsapp_history),
obj as (
  select split_part(o.name, '/', 1) as pasta, o.name, coalesce((o.metadata->>'size')::bigint, 0) as bytes, o.created_at
  from storage.objects o where o.bucket_id = 'whatsapp-chat-media'
),
alvo as (
  select obj.*, case when sc.pasta is not null then 'loja sem Central' else 'mais de 30 dias' end as motivo
  from obj left join sem_central sc on sc.pasta = obj.pasta
  where obj.pasta not in (select pasta from manter)
    and (sc.pasta is not null or obj.created_at < now() - interval '30 days')
)
select a.pasta,
       case when a.pasta = 'master' then 'WhatsApp master' else coalesce(s.name, '(loja não encontrada)') end as loja,
       a.motivo, count(*) as arquivos, round(sum(a.bytes) / 1048576.0, 1) as mb
from alvo a left join public.stores s on s.id::text = a.pasta
group by 1, 2, 3
order by 5 desc;
