-- =====================================================
-- MÓDULO: ASSINATURAS DE CLIENTES (client_subscriptions)
-- Permite lojas criarem planos de assinatura mensal
-- Ex: Corte ilimitado por R$ 89,90/mês
-- =====================================================

-- 1. Inserir o módulo na tabela modules
INSERT INTO modules (key, name, description, icon, is_active, dependencies, suggested_price, price_reference)
VALUES (
  'client_subscriptions',
  'Clube de Assinaturas',
  'Permite criar planos de assinatura mensal para clientes (corte ilimitado, pacotes de serviços, etc). Ideal para barbearias e salões.',
  'CreditCard',
  true,
  '["booking"]',
  49.90,
  'Planos de fidelidade R$ 50-100/mês em concorrentes'
) ON CONFLICT (key) DO NOTHING;

-- 2. Tabela de planos de assinatura (criados pela loja)
CREATE TABLE IF NOT EXISTS client_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'biannual', 'annual')),
  plan_type TEXT NOT NULL DEFAULT 'unlimited' CHECK (plan_type IN ('unlimited', 'limited')),
  usage_limit INT DEFAULT NULL, -- NULL = ilimitado, número = limite por ciclo
  is_active BOOLEAN NOT NULL DEFAULT true,
  benefits JSONB DEFAULT '[]', -- Benefícios extras como desconto em produtos
  image_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de serviços inclusos em cada plano
CREATE TABLE IF NOT EXISTS plan_included_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES client_subscription_plans(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  usage_limit_per_service INT DEFAULT NULL, -- NULL = usa o limite geral do plano
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, service_id)
);

-- 4. Tabela de assinaturas ativas dos clientes
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES client_subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'pending_payment')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL,
  usages_this_period INT NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'manual', -- 'manual', 'pix_efi'
  last_payment_date DATE,
  next_payment_date DATE,
  payment_amount DECIMAL(10,2),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de uso da assinatura (registro de quando cliente usou)
CREATE TABLE IF NOT EXISTS subscription_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES booking_services(id) ON DELETE RESTRICT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_by_professional_id UUID REFERENCES professionals(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de pagamentos de assinatura
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'dinheiro', 'pix', 'credito', 'debito', 'pix_efi'
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  
  -- Dados PIX EFI (se aplicável)
  pix_txid TEXT,
  pix_copia_cola TEXT,
  pix_qrcode_base64 TEXT,
  pix_expires_at TIMESTAMPTZ,
  
  -- Período que este pagamento cobre
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metadados
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_client_subscription_plans_store ON client_subscription_plans(store_id);
CREATE INDEX IF NOT EXISTS idx_client_subscription_plans_active ON client_subscription_plans(store_id, is_active);

CREATE INDEX IF NOT EXISTS idx_plan_included_services_plan ON plan_included_services(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_included_services_service ON plan_included_services(service_id);

CREATE INDEX IF NOT EXISTS idx_client_subscriptions_customer ON client_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_store ON client_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_plan ON client_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON client_subscriptions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_active ON client_subscriptions(customer_id, store_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscription_usages_subscription ON subscription_usages(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usages_booking ON subscription_usages(booking_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usages_date ON subscription_usages(subscription_id, used_at);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_store ON subscription_payments(store_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_pix ON subscription_payments(pix_txid) WHERE pix_txid IS NOT NULL;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_client_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_client_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_client_subscription_plans_updated_at ON client_subscription_plans;
CREATE TRIGGER trigger_update_client_subscription_plans_updated_at
  BEFORE UPDATE ON client_subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_client_subscription_plans_updated_at();

DROP TRIGGER IF EXISTS trigger_update_client_subscriptions_updated_at ON client_subscriptions;
CREATE TRIGGER trigger_update_client_subscriptions_updated_at
  BEFORE UPDATE ON client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_subscriptions_updated_at();

-- =====================================================
-- TRIGGER PARA INCREMENTAR USOS DA ASSINATURA
-- =====================================================

CREATE OR REPLACE FUNCTION increment_subscription_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_subscriptions
  SET usages_this_period = usages_this_period + 1,
      updated_at = NOW()
  WHERE id = NEW.subscription_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_increment_subscription_usage ON subscription_usages;
CREATE TRIGGER trigger_increment_subscription_usage
  AFTER INSERT ON subscription_usages
  FOR EACH ROW
  EXECUTE FUNCTION increment_subscription_usage();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE client_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_included_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policies para client_subscription_plans
CREATE POLICY "Loja vê seus planos de assinatura"
  ON client_subscription_plans FOR SELECT
  USING (is_store_admin_of(store_id));

CREATE POLICY "Loja cria seus planos de assinatura"
  ON client_subscription_plans FOR INSERT
  WITH CHECK (is_store_admin_of(store_id));

CREATE POLICY "Loja edita seus planos de assinatura"
  ON client_subscription_plans FOR UPDATE
  USING (is_store_admin_of(store_id));

CREATE POLICY "Loja deleta seus planos de assinatura"
  ON client_subscription_plans FOR DELETE
  USING (is_store_admin_of(store_id));

-- Policies para plan_included_services
CREATE POLICY "Loja vê serviços inclusos em seus planos"
  ON plan_included_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM client_subscription_plans p
    WHERE p.id = plan_id AND is_store_admin_of(p.store_id)
  ));

CREATE POLICY "Loja gerencia serviços inclusos em seus planos"
  ON plan_included_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM client_subscription_plans p
    WHERE p.id = plan_id AND is_store_admin_of(p.store_id)
  ));

-- Policies para client_subscriptions
CREATE POLICY "Loja vê assinaturas de sua loja"
  ON client_subscriptions FOR SELECT
  USING (is_store_admin_of(store_id));

CREATE POLICY "Loja cria assinaturas"
  ON client_subscriptions FOR INSERT
  WITH CHECK (is_store_admin_of(store_id));

CREATE POLICY "Loja edita assinaturas"
  ON client_subscriptions FOR UPDATE
  USING (is_store_admin_of(store_id));

CREATE POLICY "Cliente vê sua própria assinatura"
  ON client_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = customer_id AND c.auth_user_id = auth.uid()
  ));

-- Policies para subscription_usages
CREATE POLICY "Loja vê usos de assinaturas de sua loja"
  ON subscription_usages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM client_subscriptions s
    WHERE s.id = subscription_id AND is_store_admin_of(s.store_id)
  ));

CREATE POLICY "Loja registra usos de assinaturas"
  ON subscription_usages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_subscriptions s
    WHERE s.id = subscription_id AND is_store_admin_of(s.store_id)
  ));

-- Policies para subscription_payments
CREATE POLICY "Loja vê pagamentos de sua loja"
  ON subscription_payments FOR SELECT
  USING (is_store_admin_of(store_id));

CREATE POLICY "Loja cria pagamentos"
  ON subscription_payments FOR INSERT
  WITH CHECK (is_store_admin_of(store_id));

CREATE POLICY "Loja edita pagamentos"
  ON subscription_payments FOR UPDATE
  USING (is_store_admin_of(store_id));

-- =====================================================
-- FUNÇÃO PARA VERIFICAR COBERTURA DE SERVIÇO
-- =====================================================

CREATE OR REPLACE FUNCTION check_subscription_coverage(
  p_customer_id UUID,
  p_store_id UUID,
  p_service_id UUID
)
RETURNS TABLE (
  has_coverage BOOLEAN,
  subscription_id UUID,
  plan_name TEXT,
  usages_this_period INT,
  usage_limit INT,
  is_unlimited BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as has_coverage,
    cs.id as subscription_id,
    csp.name as plan_name,
    cs.usages_this_period,
    COALESCE(pis.usage_limit_per_service, csp.usage_limit) as usage_limit,
    (csp.plan_type = 'unlimited' AND pis.usage_limit_per_service IS NULL) as is_unlimited
  FROM client_subscriptions cs
  JOIN client_subscription_plans csp ON csp.id = cs.plan_id
  JOIN plan_included_services pis ON pis.plan_id = csp.id AND pis.service_id = p_service_id
  WHERE cs.customer_id = p_customer_id
    AND cs.store_id = p_store_id
    AND cs.status = 'active'
    AND CURRENT_DATE BETWEEN cs.current_period_start AND cs.current_period_end
    AND (
      -- Ilimitado
      (csp.plan_type = 'unlimited' AND pis.usage_limit_per_service IS NULL)
      OR
      -- Dentro do limite
      cs.usages_this_period < COALESCE(pis.usage_limit_per_service, csp.usage_limit, 999999)
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FUNÇÃO PARA CALCULAR DATA FIM DO PERÍODO
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_subscription_period_end(
  p_start_date DATE,
  p_billing_cycle TEXT
)
RETURNS DATE AS $$
BEGIN
  RETURN CASE p_billing_cycle
    WHEN 'weekly' THEN p_start_date + INTERVAL '7 days'
    WHEN 'biweekly' THEN p_start_date + INTERVAL '14 days'
    WHEN 'monthly' THEN p_start_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN p_start_date + INTERVAL '3 months'
    WHEN 'biannual' THEN p_start_date + INTERVAL '6 months'
    WHEN 'annual' THEN p_start_date + INTERVAL '1 year'
    ELSE p_start_date + INTERVAL '1 month'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;