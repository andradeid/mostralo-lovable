-- Adicionar colunas para configurações anti-bloqueio
ALTER TABLE whatsapp_campaigns 
ADD COLUMN IF NOT EXISTS pause_after_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_duration_seconds INTEGER DEFAULT 60;