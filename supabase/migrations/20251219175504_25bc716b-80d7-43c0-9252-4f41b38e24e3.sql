-- Adicionar campo openai_model na tabela master_whatsapp_config
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS openai_model TEXT DEFAULT 'gpt-4o-mini';