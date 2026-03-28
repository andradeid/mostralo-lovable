
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_notified boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_notified_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.orders.whatsapp_notified IS 'true=enviado com sucesso, false=falhou, null=não tentado';
COMMENT ON COLUMN public.orders.whatsapp_notified_at IS 'Timestamp da última tentativa de notificação WhatsApp';
