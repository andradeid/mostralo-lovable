-- Adicionar colunas para controle de áreas de entrega na tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_outside_delivery_zone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_zone_approval BOOLEAN DEFAULT false;

-- Adicionar coluna para aceitar pedidos fora da área na configuração da loja
ALTER TABLE store_configurations 
ADD COLUMN IF NOT EXISTS accept_outside_delivery_zone BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN orders.is_outside_delivery_zone IS 'Indica se o pedido foi feito de fora das áreas de entrega configuradas';
COMMENT ON COLUMN orders.requires_zone_approval IS 'Indica se o pedido requer aprovação por estar fora da área de entrega';
COMMENT ON COLUMN store_configurations.accept_outside_delivery_zone IS 'Define se a loja aceita pedidos de fora das áreas de entrega configuradas';