-- Adicionar campos de notificação na tabela master_whatsapp_config
ALTER TABLE public.master_whatsapp_config
ADD COLUMN IF NOT EXISTS notification_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_country_code TEXT DEFAULT '+55',
ADD COLUMN IF NOT EXISTS notify_new_lead BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_store BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_seller BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_payment_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_instance_disconnected BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_daily_summary BOOLEAN DEFAULT false;