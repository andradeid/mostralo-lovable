-- Adicionar campos de Trigger Type e Trigger Operator para cada bot
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS sales_bot_trigger_type TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS sales_bot_trigger_operator TEXT DEFAULT 'contains',
ADD COLUMN IF NOT EXISTS recruitment_bot_trigger_type TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS recruitment_bot_trigger_operator TEXT DEFAULT 'contains',
ADD COLUMN IF NOT EXISTS support_bot_trigger_type TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS support_bot_trigger_operator TEXT DEFAULT 'contains';