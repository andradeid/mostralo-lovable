-- =====================================================
-- FASE 1: SISTEMA DE VENDEDORES/AFILIADOS
-- =====================================================

-- 1. Adicionar 'salesperson' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'salesperson';

-- 2. Tabela principal: salespeople
CREATE TABLE IF NOT EXISTS public.salespeople (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  
  -- Dados pessoais
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  
  -- Dados da empresa (PJ obrigatório)
  cnpj TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_trade_name TEXT,
  cnae_codes TEXT[] NOT NULL DEFAULT '{}',
  cnpj_validated BOOLEAN DEFAULT FALSE,
  cnpj_validated_at TIMESTAMPTZ,
  cnpj_validation_data JSONB,
  
  -- Dados de pagamento
  pix_key TEXT,
  pix_key_type TEXT,
  
  -- Código único do vendedor
  referral_code TEXT NOT NULL UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending_approval',
  -- 'pending_approval', 'pending_contract', 'active', 'inactive', 'blocked', 'rejected'
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  contract_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de contratos aceitos
CREATE TABLE IF NOT EXISTS public.salesperson_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) NOT NULL,
  version TEXT NOT NULL,
  
  contract_text TEXT NOT NULL,
  commission_terms JSONB NOT NULL,
  bonus_terms JSONB,
  cnae_requirements TEXT[],
  
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de configuração de comissões
CREATE TABLE IF NOT EXISTS public.salesperson_commission_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) NOT NULL,
  
  commission_type TEXT NOT NULL, -- 'fixed' ou 'percentage'
  commission_value NUMERIC NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'first_payment',
  -- 'first_payment', 'recurring', 'all'
  
  min_plan_value NUMERIC,
  max_commission NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de vendas realizadas
CREATE TABLE IF NOT EXISTS public.salesperson_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) NOT NULL,
  payment_approval_id UUID REFERENCES public.payment_approvals(id) UNIQUE,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  customer_user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  
  sale_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_type TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'approved', 'paid', 'cancelled'
  
  sale_date TIMESTAMPTZ NOT NULL,
  payment_cycle_month INTEGER NOT NULL,
  payment_cycle_year INTEGER NOT NULL,
  
  quarter INTEGER NOT NULL, -- 1, 2, 3 ou 4
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de pagamentos aos vendedores
CREATE TABLE IF NOT EXISTS public.salesperson_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) NOT NULL,
  
  cycle_month INTEGER NOT NULL,
  cycle_year INTEGER NOT NULL,
  
  total_sales INTEGER NOT NULL,
  commission_total NUMERIC NOT NULL,
  bonus_total NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  
  requested_at TIMESTAMPTZ,
  invoice_url TEXT,
  invoice_number TEXT,
  pix_key TEXT,
  pix_key_type TEXT,
  
  status TEXT NOT NULL DEFAULT 'available',
  -- 'available', 'requested', 'approved', 'paid', 'rejected'
  
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  payment_proof_url TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de níveis de bônus (configurável pelo master admin)
CREATE TABLE IF NOT EXISTS public.salesperson_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tier_name TEXT NOT NULL,
  tier_order INTEGER NOT NULL,
  
  min_sales INTEGER NOT NULL,
  bonus_amount NUMERIC NOT NULL,
  
  cycle_type TEXT NOT NULL DEFAULT 'quarterly',
  is_cumulative BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de conquistas de bônus
CREATE TABLE IF NOT EXISTS public.salesperson_bonus_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID REFERENCES public.salespeople(id) NOT NULL,
  bonus_tier_id UUID REFERENCES public.salesperson_bonus_tiers(id) NOT NULL,
  
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  sales_count INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  achieved_in_month INTEGER NOT NULL,
  
  bonus_amount NUMERIC NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'included_in_payout', 'paid'
  payout_id UUID REFERENCES public.salesperson_payouts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Adicionar coluna em payment_approvals
ALTER TABLE public.payment_approvals 
ADD COLUMN IF NOT EXISTS referred_by_salesperson_id UUID REFERENCES public.salespeople(id);

-- 10. Inserir bônus padrão
INSERT INTO public.salesperson_bonus_tiers (tier_name, tier_order, min_sales, bonus_amount)
VALUES
  ('Bronze', 1, 10, 500),
  ('Prata', 2, 20, 1000),
  ('Ouro', 3, 30, 2000),
  ('Diamante', 4, 50, 5000)
ON CONFLICT DO NOTHING;

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_salespeople_referral_code ON public.salespeople(referral_code);
CREATE INDEX IF NOT EXISTS idx_salespeople_status ON public.salespeople(status);
CREATE INDEX IF NOT EXISTS idx_salesperson_sales_salesperson_quarter ON public.salesperson_sales(salesperson_id, quarter, payment_cycle_year);
CREATE INDEX IF NOT EXISTS idx_salesperson_payouts_status ON public.salesperson_payouts(status);

-- 12. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_salespeople_updated_at ON public.salespeople;
CREATE TRIGGER update_salespeople_updated_at
  BEFORE UPDATE ON public.salespeople
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salesperson_commission_configs_updated_at ON public.salesperson_commission_configs;
CREATE TRIGGER update_salesperson_commission_configs_updated_at
  BEFORE UPDATE ON public.salesperson_commission_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salesperson_payouts_updated_at ON public.salesperson_payouts;
CREATE TRIGGER update_salesperson_payouts_updated_at
  BEFORE UPDATE ON public.salesperson_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salesperson_bonus_tiers_updated_at ON public.salesperson_bonus_tiers;
CREATE TRIGGER update_salesperson_bonus_tiers_updated_at
  BEFORE UPDATE ON public.salesperson_bonus_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. RLS Policies

-- salespeople: vendedores podem ver próprios dados, master admin vê todos
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver seus próprios dados"
  ON public.salespeople FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Master admins podem gerenciar todos os vendedores"
  ON public.salespeople FOR ALL
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Público pode criar vendedores (auto-cadastro)"
  ON public.salespeople FOR INSERT
  WITH CHECK (true);

-- salesperson_contracts: vendedor vê seus contratos, master admin vê todos
ALTER TABLE public.salesperson_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver seus contratos"
  ON public.salesperson_contracts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_contracts.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Master admins podem ver todos os contratos"
  ON public.salesperson_contracts FOR SELECT
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Sistema pode inserir contratos"
  ON public.salesperson_contracts FOR INSERT
  WITH CHECK (true);

-- salesperson_commission_configs: vendedor vê sua config, master admin gerencia
ALTER TABLE public.salesperson_commission_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver sua configuração"
  ON public.salesperson_commission_configs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_commission_configs.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Master admins podem gerenciar configs"
  ON public.salesperson_commission_configs FOR ALL
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- salesperson_sales: vendedor vê suas vendas, master admin vê todas
ALTER TABLE public.salesperson_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver suas vendas"
  ON public.salesperson_sales FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_sales.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Master admins podem ver todas as vendas"
  ON public.salesperson_sales FOR SELECT
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Sistema pode inserir vendas"
  ON public.salesperson_sales FOR INSERT
  WITH CHECK (true);

-- salesperson_payouts: vendedor vê seus pagamentos, master admin gerencia
ALTER TABLE public.salesperson_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver seus pagamentos"
  ON public.salesperson_payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_payouts.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Vendedores podem solicitar pagamentos"
  ON public.salesperson_payouts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_payouts.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Master admins podem gerenciar pagamentos"
  ON public.salesperson_payouts FOR ALL
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- salesperson_bonus_tiers: todos podem ver, master admin gerencia
ALTER TABLE public.salesperson_bonus_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver níveis de bônus"
  ON public.salesperson_bonus_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Master admins podem gerenciar níveis"
  ON public.salesperson_bonus_tiers FOR ALL
  USING (has_role(auth.uid(), 'master_admin'::app_role));

-- salesperson_bonus_achievements: vendedor vê suas conquistas, master admin vê todas
ALTER TABLE public.salesperson_bonus_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores podem ver suas conquistas"
  ON public.salesperson_bonus_achievements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.salespeople
    WHERE salespeople.id = salesperson_bonus_achievements.salesperson_id
    AND salespeople.user_id = auth.uid()
  ));

CREATE POLICY "Master admins podem ver todas as conquistas"
  ON public.salesperson_bonus_achievements FOR SELECT
  USING (has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Sistema pode inserir conquistas"
  ON public.salesperson_bonus_achievements FOR INSERT
  WITH CHECK (true);

-- 14. Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('salesperson-invoices', 'salesperson-invoices', false),
  ('salesperson-payment-proofs', 'salesperson-payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage: salesperson-invoices
CREATE POLICY "Vendedores podem fazer upload de suas NFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'salesperson-invoices' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Vendedores podem ver suas NFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salesperson-invoices' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Master admins podem ver todas as NFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salesperson-invoices' 
    AND has_role(auth.uid(), 'master_admin'::app_role)
  );

-- RLS para storage: salesperson-payment-proofs
CREATE POLICY "Master admins podem fazer upload de comprovantes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'salesperson-payment-proofs' 
    AND has_role(auth.uid(), 'master_admin'::app_role)
  );

CREATE POLICY "Vendedores podem ver comprovantes de seus pagamentos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salesperson-payment-proofs' 
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salespeople WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem ver todos os comprovantes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salesperson-payment-proofs' 
    AND has_role(auth.uid(), 'master_admin'::app_role)
  );