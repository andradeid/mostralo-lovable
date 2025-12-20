-- Adicionar campos para segundo número de notificação e template de mensagem
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS notification_phone_2 TEXT,
ADD COLUMN IF NOT EXISTS notification_country_code_2 TEXT DEFAULT '+55',
ADD COLUMN IF NOT EXISTS new_order_message_template TEXT;

-- Comentários para documentação
COMMENT ON COLUMN stores.notification_phone_2 IS 'Segundo número opcional para receber notificações de novos pedidos';
COMMENT ON COLUMN stores.notification_country_code_2 IS 'Código do país para o segundo número de notificação';
COMMENT ON COLUMN stores.new_order_message_template IS 'Template customizável da mensagem de notificação de novo pedido';