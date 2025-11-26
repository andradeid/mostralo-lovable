-- Adicionar campo para data/hora agendada na tabela orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN orders.scheduled_for IS 'Data e hora em que o pedido foi agendado para ser entregue/retirado. NULL indica pedido imediato ("o mais rápido possível")';