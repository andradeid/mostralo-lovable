-- Adicionar campo de reativação automática na config do bot
ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS auto_reactivate_minutes INTEGER DEFAULT 0;
-- 0 = reativação manual apenas
-- 5-120 = minutos até reativar automaticamente

COMMENT ON COLUMN store_bot_config.auto_reactivate_minutes IS 'Minutos para reativação automática do bot após pausa. 0 = apenas manual.';

-- Criar tabela para rastrear contatos pausados
CREATE TABLE IF NOT EXISTS whatsapp_paused_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  customer_name TEXT,
  paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_by TEXT DEFAULT 'manual_reply',
  auto_reactivate_at TIMESTAMPTZ,
  reactivated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('paused', 'reactivated', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id, remote_jid, status)
);

-- Índice para CRON buscar contatos a reativar
CREATE INDEX IF NOT EXISTS idx_paused_contacts_reactivate 
ON whatsapp_paused_contacts(auto_reactivate_at, status) 
WHERE status = 'paused' AND auto_reactivate_at IS NOT NULL;

-- Índice para busca por store
CREATE INDEX IF NOT EXISTS idx_paused_contacts_store 
ON whatsapp_paused_contacts(store_id, status);

-- RLS para whatsapp_paused_contacts
ALTER TABLE whatsapp_paused_contacts ENABLE ROW LEVEL SECURITY;

-- Donos podem ver e gerenciar contatos pausados da sua loja
CREATE POLICY "store_owners_manage_paused_contacts"
ON whatsapp_paused_contacts
FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = whatsapp_paused_contacts.store_id 
  AND stores.owner_id = auth.uid()
));

-- Sistema pode inserir/atualizar (para webhook e CRON)
CREATE POLICY "system_manage_paused_contacts"
ON whatsapp_paused_contacts
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_paused_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_paused_contacts_updated_at ON whatsapp_paused_contacts;
CREATE TRIGGER trg_update_paused_contacts_updated_at
  BEFORE UPDATE ON whatsapp_paused_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_paused_contacts_updated_at();