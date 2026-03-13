
ALTER TABLE public.master_whatsapp_config
  ADD COLUMN IF NOT EXISTS bot_name text DEFAULT 'Assistente',
  ADD COLUMN IF NOT EXISTS bot_personality text DEFAULT 'amigavel',
  ADD COLUMN IF NOT EXISTS bot_emoji_usage text DEFAULT 'moderado',
  ADD COLUMN IF NOT EXISTS bot_custom_greeting text DEFAULT '';
