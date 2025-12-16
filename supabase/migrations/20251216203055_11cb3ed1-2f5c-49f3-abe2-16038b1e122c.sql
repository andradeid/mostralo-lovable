-- Adicionar campos de personalidade e configurações de prompt na tabela store_bot_config
ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS personality TEXT DEFAULT 'friendly',
ADD COLUMN IF NOT EXISTS emoji_level TEXT DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS custom_greeting TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS include_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_business_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_payment_methods BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_delivery_fee BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS include_min_order BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN store_bot_config.personality IS 'Tipo de personalidade do bot: professional, friendly, fun, consultive';
COMMENT ON COLUMN store_bot_config.emoji_level IS 'Nível de uso de emojis: none, moderate, abundant';
COMMENT ON COLUMN store_bot_config.custom_greeting IS 'Saudação personalizada opcional';
COMMENT ON COLUMN store_bot_config.include_location IS 'Incluir localização no prompt do bot';
COMMENT ON COLUMN store_bot_config.include_business_hours IS 'Incluir horário de funcionamento no prompt';
COMMENT ON COLUMN store_bot_config.include_payment_methods IS 'Incluir métodos de pagamento no prompt';
COMMENT ON COLUMN store_bot_config.include_delivery_fee IS 'Incluir taxa de entrega no prompt';
COMMENT ON COLUMN store_bot_config.include_min_order IS 'Incluir pedido mínimo no prompt';