-- Adicionar novos campos para o Assistente Inteligente v2
-- Permite lojas com catálogos grandes usarem consultas em tempo real

ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS bot_mode text DEFAULT 'chat_completion',
ADD COLUMN IF NOT EXISTS openai_assistant_id text,
ADD COLUMN IF NOT EXISTS custom_prompt_instructions text;

-- Comentários explicativos
COMMENT ON COLUMN store_bot_config.bot_mode IS 'Modo do assistente: chat_completion (atual com produtos no prompt) ou assistant (v2 com consultas em tempo real)';
COMMENT ON COLUMN store_bot_config.openai_assistant_id IS 'ID do OpenAI Assistant para lojas usando modo assistant';
COMMENT ON COLUMN store_bot_config.custom_prompt_instructions IS 'Instruções personalizadas do lojista para o assistente (ex: regras de recomendação, informações específicas)';