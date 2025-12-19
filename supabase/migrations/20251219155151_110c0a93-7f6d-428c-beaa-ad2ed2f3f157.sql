-- Adicionar campo openai_api_key na tabela master_whatsapp_config
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

COMMENT ON COLUMN master_whatsapp_config.openai_api_key IS 'API Key OpenAI específica para a instância master (separada das lojas)';