ALTER TABLE public.store_bot_config 
ADD COLUMN IF NOT EXISTS uazapi_assistant_id text,
ADD COLUMN IF NOT EXISTS whatsapp_provider text DEFAULT 'evolution';