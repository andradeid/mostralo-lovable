ALTER TABLE public.whatsapp_conversation_analysis 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;