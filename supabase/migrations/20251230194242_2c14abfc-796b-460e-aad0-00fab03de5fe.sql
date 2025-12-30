-- Tabela para configuração centralizada de canais de vendas
CREATE TABLE IF NOT EXISTS store_sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Canais de venda
  delivery_enabled BOOLEAN DEFAULT true,
  ifood_enabled BOOLEAN DEFAULT true,
  totem_enabled BOOLEAN DEFAULT true,
  mesa_enabled BOOLEAN DEFAULT true,
  pdv_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(store_id)
);

-- RLS
ALTER TABLE store_sales_channels ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "Lojistas podem ver sua config de canais"
ON store_sales_channels FOR SELECT
USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- Policy para INSERT
CREATE POLICY "Lojistas podem criar config de canais"
ON store_sales_channels FOR INSERT
WITH CHECK (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- Policy para UPDATE
CREATE POLICY "Lojistas podem atualizar config de canais"
ON store_sales_channels FOR UPDATE
USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- Policy para DELETE
CREATE POLICY "Lojistas podem deletar config de canais"
ON store_sales_channels FOR DELETE
USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_store_sales_channels_updated_at
BEFORE UPDATE ON store_sales_channels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();