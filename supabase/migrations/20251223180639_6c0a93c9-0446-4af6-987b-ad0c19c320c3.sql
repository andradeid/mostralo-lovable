-- =============================================
-- MÓDULO SENTINELA - Lembretes Inteligentes de Recompra
-- =============================================

-- 1. Adicionar campo recurrence_days na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS recurrence_days INTEGER DEFAULT NULL;
COMMENT ON COLUMN products.recurrence_days IS 'Ciclo de recompra em dias. NULL = sem recorrência';

-- 2. Adicionar configurações SENTINELA na tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_enabled BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_default_template TEXT DEFAULT 'Olá {primeiro_nome}! 👋

Lembrete amigável da {loja}! 

Seu *{produto}* deve estar acabando, né? 🏃‍♂️

🛒 Aproveite para repor agora:
{link_loja}

Qualquer dúvida, é só chamar! 💬';

-- 3. Criar tabela sentinela_rules (regras de recompra por produto)
CREATE TABLE IF NOT EXISTS sentinela_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  recurrence_days INTEGER NOT NULL DEFAULT 30,
  reminder_days_before INTEGER NOT NULL DEFAULT 3,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Pode ser regra por produto OU por categoria
  CONSTRAINT check_product_or_category CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  ),
  -- Uma regra por produto ou categoria por loja
  UNIQUE(store_id, product_id),
  UNIQUE(store_id, category_id)
);

-- 4. Criar tabela sentinela_reminders (lembretes agendados/enviados)
CREATE TABLE IF NOT EXISTS sentinela_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES sentinela_rules(id) ON DELETE SET NULL,
  scheduled_for DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'converted')),
  sent_at TIMESTAMPTZ,
  message_sent TEXT,
  error_message TEXT,
  conversion_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sentinela_rules_store ON sentinela_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_sentinela_rules_product ON sentinela_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_sentinela_rules_category ON sentinela_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_sentinela_rules_active ON sentinela_rules(store_id, is_active);

CREATE INDEX IF NOT EXISTS idx_sentinela_reminders_store ON sentinela_reminders(store_id);
CREATE INDEX IF NOT EXISTS idx_sentinela_reminders_customer ON sentinela_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sentinela_reminders_scheduled ON sentinela_reminders(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_sentinela_reminders_status ON sentinela_reminders(status);

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sentinela_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_sentinela_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sentinela_rules_updated_at ON sentinela_rules;
CREATE TRIGGER trg_sentinela_rules_updated_at
  BEFORE UPDATE ON sentinela_rules
  FOR EACH ROW EXECUTE FUNCTION update_sentinela_rules_updated_at();

DROP TRIGGER IF EXISTS trg_sentinela_reminders_updated_at ON sentinela_reminders;
CREATE TRIGGER trg_sentinela_reminders_updated_at
  BEFORE UPDATE ON sentinela_reminders
  FOR EACH ROW EXECUTE FUNCTION update_sentinela_reminders_updated_at();

-- 7. RLS Policies para sentinela_rules
ALTER TABLE sentinela_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage their sentinela rules"
ON sentinela_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = sentinela_rules.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = sentinela_rules.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Master admins can view all sentinela rules"
ON sentinela_rules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- 8. RLS Policies para sentinela_reminders
ALTER TABLE sentinela_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their sentinela reminders"
ON sentinela_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = sentinela_reminders.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can manage their sentinela reminders"
ON sentinela_reminders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = sentinela_reminders.store_id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = sentinela_reminders.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Master admins can view all sentinela reminders"
ON sentinela_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);