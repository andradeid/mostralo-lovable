-- Adicionar colunas de configurações avançadas na tabela store_bot_config
ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS bot_split_messages boolean DEFAULT true;

ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS bot_time_per_char integer DEFAULT 0;