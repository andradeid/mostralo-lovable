-- Adicionar campos avançados na tabela master_admin_test_config
ALTER TABLE master_admin_test_config
ADD COLUMN IF NOT EXISTS bot_unknown_message TEXT DEFAULT 'Desculpe, não entendi sua mensagem. Digite #SAIR para encerrar.',
ADD COLUMN IF NOT EXISTS bot_listening_from_me BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_keep_open BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_debounce_time INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS bot_split_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS bot_time_per_char INTEGER DEFAULT 0;