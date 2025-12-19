-- Adicionar campo short_reference para o localizador do iFood
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS short_reference TEXT;

-- Criar índice para buscas por short_reference
CREATE INDEX IF NOT EXISTS idx_orders_short_reference ON public.orders(short_reference);

-- Criar índice para buscas por external_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);

-- Limpar pedidos duplicados do iFood (manter apenas o mais antigo de cada external_id)
WITH duplicates AS (
  SELECT id, external_id, store_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY external_id, store_id ORDER BY created_at ASC) as rn
  FROM orders 
  WHERE source = 'ifood' AND external_id IS NOT NULL
)
DELETE FROM orders 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Atualizar pedido existente para cancelado (baseado nos eventos do iFood)
UPDATE orders 
SET status = 'cancelado', 
    cancelled_at = NOW(),
    cancellation_reason = 'Cancelado pelo restaurante no iFood'
WHERE external_id = 'e6261578-ab9a-460c-8519-90bafe660859'
AND status != 'cancelado';

-- Marcar eventos relacionados como processados
UPDATE ifood_events_log
SET processed = true, processed_at = NOW()
WHERE order_id = 'e6261578-ab9a-460c-8519-90bafe660859';