-- =============================================
-- FASE 1: Sistema de Propostas Comerciais
-- =============================================

-- 1.1 Tabela de Nichos
CREATE TABLE public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Nichos são públicos para leitura
CREATE POLICY "Niches are publicly readable" ON public.niches
  FOR SELECT USING (true);

-- Apenas master admin pode gerenciar nichos
CREATE POLICY "Master admin can manage niches" ON public.niches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- Inserir nichos padrão
INSERT INTO public.niches (name, icon) VALUES
  ('Barbearia', 'Scissors'),
  ('Salão de Beleza', 'Sparkles'),
  ('Pizzaria', 'Pizza'),
  ('Hamburgueria', 'Beef'),
  ('Restaurante', 'UtensilsCrossed'),
  ('Cafeteria', 'Coffee'),
  ('Pet Shop', 'PawPrint'),
  ('Clínica/Estética', 'Heart'),
  ('Academia', 'Dumbbell'),
  ('Padaria', 'Croissant'),
  ('Açougue', 'Beef'),
  ('Mercado/Mercadinho', 'ShoppingCart'),
  ('Lanchonete', 'Sandwich'),
  ('Sorveteria', 'IceCream'),
  ('Doceria', 'Cake'),
  ('Farmácia', 'Pill'),
  ('Loja de Roupas', 'Shirt'),
  ('Ótica', 'Glasses'),
  ('Papelaria', 'BookOpen'),
  ('Outros', 'Store');

-- 1.2 Tabela de Templates por Nicho
CREATE TABLE public.niche_module_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche_id UUID REFERENCES public.niches(id) ON DELETE CASCADE,
  description TEXT,
  module_ids UUID[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.niche_module_templates ENABLE ROW LEVEL SECURITY;

-- Master admin tem acesso total
CREATE POLICY "Master admin full access to templates" ON public.niche_module_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- Vendedores podem ler templates (identificados pela tabela salespeople)
CREATE POLICY "Salespeople can read templates" ON public.niche_module_templates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM salespeople WHERE user_id = auth.uid())
  );

-- 1.3 Tabela de Propostas Comerciais
CREATE TABLE public.commercial_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Dados do cliente
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT NOT NULL,
  client_company TEXT,
  niche_id UUID REFERENCES public.niches(id),
  
  -- Módulos selecionados (JSONB com id, name, price)
  selected_modules JSONB NOT NULL DEFAULT '[]',
  
  -- Valores
  modules_total NUMERIC NOT NULL DEFAULT 0,
  setup_fee NUMERIC DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  final_monthly_price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly',
  
  -- Status: draft, sent, viewed, accepted, rejected, expired
  status TEXT DEFAULT 'draft',
  valid_until DATE,
  
  -- Rastreamento
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Assinatura digital
  signature_data JSONB,
  contract_accepted BOOLEAN DEFAULT false,
  
  -- Vínculos
  created_by UUID REFERENCES public.profiles(id),
  salesperson_id UUID REFERENCES public.salespeople(id),
  store_id UUID REFERENCES public.stores(id),
  payment_approval_id UUID REFERENCES public.payment_approvals(id),
  
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;

-- Master admin vê tudo
CREATE POLICY "Master admin full access to proposals" ON public.commercial_proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- Vendedor vê apenas suas propostas
CREATE POLICY "Salesperson own proposals" ON public.commercial_proposals
  FOR ALL USING (
    salesperson_id IN (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
  );

-- Acesso público para leitura via slug (para página de aceite)
CREATE POLICY "Public can view proposal by slug" ON public.commercial_proposals
  FOR SELECT USING (true);

-- 1.4 Tabela de Log de Atividades
CREATE TABLE public.proposal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.commercial_proposals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.proposal_activity_log ENABLE ROW LEVEL SECURITY;

-- Master admin vê todos os logs
CREATE POLICY "Master admin can view all logs" ON public.proposal_activity_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- Vendedor vê logs das suas propostas
CREATE POLICY "Salesperson can view own proposal logs" ON public.proposal_activity_log
  FOR SELECT USING (
    proposal_id IN (
      SELECT cp.id FROM commercial_proposals cp
      JOIN salespeople sp ON cp.salesperson_id = sp.id
      WHERE sp.user_id = auth.uid()
    )
  );

-- Inserção pública para registrar visualizações
CREATE POLICY "Anyone can insert activity logs" ON public.proposal_activity_log
  FOR INSERT WITH CHECK (true);

-- Função para gerar número de proposta
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_month := to_char(now(), 'YYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(proposal_number FROM 5) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM commercial_proposals
  WHERE proposal_number LIKE year_month || '%';
  
  new_number := year_month || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION public.generate_proposal_slug()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_commercial_proposals_updated_at
  BEFORE UPDATE ON public.commercial_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_niche_module_templates_updated_at
  BEFORE UPDATE ON public.niche_module_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_commercial_proposals_status ON public.commercial_proposals(status);
CREATE INDEX idx_commercial_proposals_salesperson ON public.commercial_proposals(salesperson_id);
CREATE INDEX idx_commercial_proposals_slug ON public.commercial_proposals(slug);
CREATE INDEX idx_commercial_proposals_created_at ON public.commercial_proposals(created_at DESC);
CREATE INDEX idx_proposal_activity_log_proposal ON public.proposal_activity_log(proposal_id);
CREATE INDEX idx_niche_module_templates_niche ON public.niche_module_templates(niche_id);