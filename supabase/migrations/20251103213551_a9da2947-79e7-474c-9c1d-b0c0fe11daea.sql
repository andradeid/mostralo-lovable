-- Criar tabela de faturas/mensalidades
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('pix', 'card', 'boleto', 'bank_transfer', 'other')),
  payment_proof_url TEXT,
  pix_qr_code TEXT,
  pix_key TEXT,
  payment_link TEXT,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_subscription_invoices_store_id ON subscription_invoices(store_id);
CREATE INDEX idx_subscription_invoices_payment_status ON subscription_invoices(payment_status);
CREATE INDEX idx_subscription_invoices_due_date ON subscription_invoices(due_date);

-- Criar tabela de configuração de pagamentos
CREATE TABLE subscription_payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  account_holder_name TEXT NOT NULL,
  payment_instructions TEXT,
  enable_manual_approval BOOLEAN DEFAULT true,
  enable_auto_approval BOOLEAN DEFAULT false,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO subscription_payment_config (
  pix_key,
  pix_key_type,
  account_holder_name,
  payment_instructions,
  is_active
) VALUES (
  'contato@mostralo.com',
  'email',
  'Sistema Mostralo',
  'Envie o comprovante após realizar o pagamento via PIX. A aprovação será feita em até 24 horas.',
  true
);

-- Criar bucket para comprovantes de pagamento (se não existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('subscription-receipts', 'subscription-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para subscription_invoices
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Lojistas podem ver suas próprias faturas
CREATE POLICY "Lojistas podem ver suas faturas"
ON subscription_invoices
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Lojistas podem atualizar suas faturas (anexar comprovante)
CREATE POLICY "Lojistas podem atualizar suas faturas"
ON subscription_invoices
FOR UPDATE
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Master admin pode fazer tudo
CREATE POLICY "Master admin pode gerenciar todas faturas"
ON subscription_invoices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- RLS para subscription_payment_config
ALTER TABLE subscription_payment_config ENABLE ROW LEVEL SECURITY;

-- Lojistas podem visualizar configurações (para ver PIX)
CREATE POLICY "Lojistas podem ver config de pagamento"
ON subscription_payment_config
FOR SELECT
TO authenticated
USING (is_active = true);

-- Master admin pode gerenciar
CREATE POLICY "Master admin pode gerenciar config"
ON subscription_payment_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- RLS para bucket de comprovantes
CREATE POLICY "Lojistas podem fazer upload de comprovantes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'subscription-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Lojistas podem ver seus comprovantes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'subscription-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Master admin pode ver todos comprovantes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'subscription-receipts' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'master_admin'
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_invoices_updated_at
BEFORE UPDATE ON subscription_invoices
FOR EACH ROW
EXECUTE FUNCTION update_subscription_invoices_updated_at();

CREATE TRIGGER subscription_payment_config_updated_at
BEFORE UPDATE ON subscription_payment_config
FOR EACH ROW
EXECUTE FUNCTION update_subscription_invoices_updated_at();