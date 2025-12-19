ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS sales_bot_auto_reactivate_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recruitment_bot_auto_reactivate_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS support_bot_auto_reactivate_minutes INTEGER DEFAULT 0;