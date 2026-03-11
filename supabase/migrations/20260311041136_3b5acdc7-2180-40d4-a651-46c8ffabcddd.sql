ALTER TABLE public.whatsapp_chat_messages 
ADD COLUMN IF NOT EXISTS message_source text DEFAULT 'system';

COMMENT ON COLUMN public.whatsapp_chat_messages.message_source IS 'Origin of the message: cellphone, system, bot, unknown';