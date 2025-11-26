-- Forçar reload do schema do PostgREST
-- Adicionar comentário para atualizar o cache
COMMENT ON TABLE public.customers IS 'Tabela global de clientes (sem store_id)';
COMMENT ON TABLE public.customer_stores IS 'Relacionamento N:N entre clientes e lojas';