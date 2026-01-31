-- Adicionar colunas para armazenar IDs dos OpenAI Assistants
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS sales_openai_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS recruitment_openai_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS support_openai_assistant_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN master_whatsapp_config.sales_openai_assistant_id IS 'ID do OpenAI Assistant para bot de vendas';
COMMENT ON COLUMN master_whatsapp_config.recruitment_openai_assistant_id IS 'ID do OpenAI Assistant para bot de recrutamento';
COMMENT ON COLUMN master_whatsapp_config.support_openai_assistant_id IS 'ID do OpenAI Assistant para bot de suporte';