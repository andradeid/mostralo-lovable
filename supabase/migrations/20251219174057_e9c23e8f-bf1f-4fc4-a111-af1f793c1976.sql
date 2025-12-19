-- Add primary_bot_type column to master_whatsapp_config
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS primary_bot_type TEXT DEFAULT 'sales' 
CHECK (primary_bot_type IN ('sales', 'recruitment', 'support'));