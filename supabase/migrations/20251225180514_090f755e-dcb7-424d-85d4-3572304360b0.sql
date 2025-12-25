-- Adicionar campos para Lista Interativa nas tabelas de campanha
ALTER TABLE whatsapp_campaigns 
ADD COLUMN IF NOT EXISTS list_title TEXT,
ADD COLUMN IF NOT EXISTS list_button_text TEXT,
ADD COLUMN IF NOT EXISTS list_sections JSONB;

-- Adicionar campos na tabela de mensagens
ALTER TABLE whatsapp_messages
ADD COLUMN IF NOT EXISTS list_title TEXT,
ADD COLUMN IF NOT EXISTS list_button_text TEXT,
ADD COLUMN IF NOT EXISTS list_sections JSONB;

-- Comentários descritivos
COMMENT ON COLUMN whatsapp_campaigns.list_title IS 'Título geral da lista interativa';
COMMENT ON COLUMN whatsapp_campaigns.list_button_text IS 'Texto do botão que abre a lista (ex: Ver opções)';
COMMENT ON COLUMN whatsapp_campaigns.list_sections IS 'Seções com itens: [{title, rows: [{title, description, rowId}]}]';

COMMENT ON COLUMN whatsapp_messages.list_title IS 'Título geral da lista interativa';
COMMENT ON COLUMN whatsapp_messages.list_button_text IS 'Texto do botão que abre a lista';
COMMENT ON COLUMN whatsapp_messages.list_sections IS 'Seções com itens da lista';