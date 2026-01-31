-- Adicionar coluna para assistant unificado
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS unified_openai_assistant_id TEXT;