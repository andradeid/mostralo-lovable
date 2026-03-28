-- Índice parcial otimizado: apenas profissionais ativos (o mais usado em RLS e queries)
CREATE INDEX IF NOT EXISTS idx_professionals_active_only 
ON public.professionals (store_id) 
WHERE is_active = true;

-- Atualizar estatísticas para forçar o planner a usar os índices
ANALYZE public.professionals;