-- Adicionar campo openai_api_key na tabela stores (para cada loja ter sua própria key)
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

COMMENT ON COLUMN stores.openai_api_key IS 'API Key OpenAI específica desta loja (configurada pelo master admin)';

-- Adicionar campo openai_api_key na tabela master_admin_test_config (key separada do master para testes)
ALTER TABLE master_admin_test_config 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

COMMENT ON COLUMN master_admin_test_config.openai_api_key IS 'API Key OpenAI do master admin para testes';