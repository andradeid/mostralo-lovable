-- Adicionar coluna para tempo estimado de entrega/preparo
ALTER TABLE orders 
ADD COLUMN estimated_delivery_minutes INTEGER;

COMMENT ON COLUMN orders.estimated_delivery_minutes IS 'Tempo estimado em minutos para entrega/preparo, definido pelo lojista ao aceitar o pedido';