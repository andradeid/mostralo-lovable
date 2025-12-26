-- ==========================================
-- Módulo: Cardápio na Mesa (Self-Service)
-- ==========================================

-- 1. Adicionar módulo self_service_table
INSERT INTO modules (key, name, description, icon, is_active)
VALUES ('self_service_table', 'Cardápio na Mesa', 'Clientes fazem pedidos via QR Code na mesa', 'QrCode', true)
ON CONFLICT (key) DO NOTHING;

-- 2. Adicionar campos em comandas para self-service
ALTER TABLE comandas 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'garcom';

-- Adicionar constraint de source (verificar valores válidos)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comandas_source_check'
  ) THEN
    ALTER TABLE comandas ADD CONSTRAINT comandas_source_check 
      CHECK (source IN ('garcom', 'pdv', 'self_service'));
  END IF;
END $$;

-- 3. Adicionar campos em comanda_items para aprovação do garçom
ALTER TABLE comanda_items 
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 4. Criar tabela de configuração do módulo por loja
CREATE TABLE IF NOT EXISTS store_table_service_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  require_waiter_approval BOOLEAN DEFAULT true,
  allow_direct_payment BOOLEAN DEFAULT false,
  customer_password_required BOOLEAN DEFAULT true,
  max_comandas_per_table INTEGER DEFAULT 10,
  table_count INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id)
);

-- Enable RLS
ALTER TABLE store_table_service_config ENABLE ROW LEVEL SECURITY;

-- Policies para store_table_service_config
CREATE POLICY "Store admins can view their config" ON store_table_service_config
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

CREATE POLICY "Store admins can insert their config" ON store_table_service_config
  FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

CREATE POLICY "Store admins can update their config" ON store_table_service_config
  FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- 5. Adicionar campos de senha em customers (se não existirem)
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS table_password TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comandas_source ON comandas(source);
CREATE INDEX IF NOT EXISTS idx_comandas_customer_id ON comandas(customer_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_requires_approval ON comanda_items(requires_approval) WHERE requires_approval = true;

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_store_table_service_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_store_table_service_config_timestamp ON store_table_service_config;
CREATE TRIGGER update_store_table_service_config_timestamp
  BEFORE UPDATE ON store_table_service_config
  FOR EACH ROW
  EXECUTE FUNCTION update_store_table_service_config_updated_at();