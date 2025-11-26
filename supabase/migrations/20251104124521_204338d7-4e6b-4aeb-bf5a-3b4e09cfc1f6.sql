-- Criar tabela de links de convite para lojas
CREATE TABLE store_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER, -- NULL = ilimitado
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_store_invite_links_token ON store_invite_links(token);
CREATE INDEX idx_store_invite_links_store_id ON store_invite_links(store_id);
CREATE INDEX idx_store_invite_links_active ON store_invite_links(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE store_invite_links ENABLE ROW LEVEL SECURITY;

-- Policy: Lojistas podem gerenciar links da sua loja
CREATE POLICY "Lojistas podem gerenciar links da sua loja"
ON store_invite_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = store_invite_links.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Policy: Master admins podem ver todos os links
CREATE POLICY "Master admins podem ver todos os links"
ON store_invite_links
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Policy: Público pode validar tokens (apenas SELECT com token específico)
CREATE POLICY "Público pode validar tokens ativos"
ON store_invite_links
FOR SELECT
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Trigger para updated_at
CREATE TRIGGER update_store_invite_links_updated_at
BEFORE UPDATE ON store_invite_links
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE store_invite_links;