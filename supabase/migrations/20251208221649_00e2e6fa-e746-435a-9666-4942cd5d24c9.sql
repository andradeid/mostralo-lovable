-- Adicionar coluna custom_scripts na tabela store_configurations
ALTER TABLE store_configurations 
ADD COLUMN IF NOT EXISTS custom_scripts JSONB DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN store_configurations.custom_scripts IS 'Scripts personalizados para a loja: head_scripts, body_start_scripts, body_end_scripts';