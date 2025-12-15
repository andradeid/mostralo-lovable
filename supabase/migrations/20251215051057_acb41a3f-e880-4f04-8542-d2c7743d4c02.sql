-- Tabela de configuração de regras de atividade de vendedores
CREATE TABLE public.salesperson_activity_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Períodos de avaliação
  evaluation_period TEXT NOT NULL DEFAULT 'quarterly', -- 'monthly', 'quarterly', 'yearly'
  
  -- Faixas de comissão baseadas em clientes ativos
  tier_full_commission INTEGER NOT NULL DEFAULT 10, -- 100% comissão
  tier_reduced_commission INTEGER NOT NULL DEFAULT 5, -- 80% comissão
  tier_minimum_commission INTEGER NOT NULL DEFAULT 1, -- 50% comissão
  -- 0 clientes = 0% comissão (suspensa)
  
  -- Percentuais de cada faixa
  full_commission_percentage INTEGER NOT NULL DEFAULT 100,
  reduced_commission_percentage INTEGER NOT NULL DEFAULT 80,
  minimum_commission_percentage INTEGER NOT NULL DEFAULT 50,
  
  -- Período de graça e notificações
  grace_period_days INTEGER NOT NULL DEFAULT 30,
  notify_days_before INTEGER NOT NULL DEFAULT 15,
  
  -- Reativação
  allow_reactivation BOOLEAN NOT NULL DEFAULT true,
  reactivation_requires_new_sale BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadados
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Apenas uma configuração ativa por vez
CREATE UNIQUE INDEX salesperson_activity_rules_active_idx 
ON salesperson_activity_rules (is_active) 
WHERE is_active = true;

-- Adicionar campos de tracking na tabela salespeople
ALTER TABLE public.salespeople 
ADD COLUMN IF NOT EXISTS active_clients_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sale_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS commission_tier TEXT DEFAULT 'full', -- 'full', 'reduced', 'minimum', 'suspended'
ADD COLUMN IF NOT EXISTS commission_percentage INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS commission_suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS last_tier_evaluation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tier_warning_sent_at TIMESTAMP WITH TIME ZONE;

-- Histórico de avaliações de carteira
CREATE TABLE public.salesperson_portfolio_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  
  -- Período avaliado
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Métricas no momento da avaliação
  active_clients_count INTEGER NOT NULL DEFAULT 0,
  new_sales_count INTEGER NOT NULL DEFAULT 0,
  churned_clients_count INTEGER NOT NULL DEFAULT 0,
  
  -- Resultado
  previous_tier TEXT,
  new_tier TEXT NOT NULL,
  previous_commission_percentage INTEGER,
  new_commission_percentage INTEGER NOT NULL,
  
  -- Notas
  notes TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_portfolio_evaluations_salesperson ON salesperson_portfolio_evaluations(salesperson_id);
CREATE INDEX idx_portfolio_evaluations_period ON salesperson_portfolio_evaluations(evaluation_period_start, evaluation_period_end);

-- RLS
ALTER TABLE public.salesperson_activity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salesperson_portfolio_evaluations ENABLE ROW LEVEL SECURITY;

-- Políticas para salesperson_activity_rules
CREATE POLICY "Master admins can manage activity rules"
ON public.salesperson_activity_rules FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Salespeople can view active rules"
ON public.salesperson_activity_rules FOR SELECT
USING (is_active = true AND EXISTS (
  SELECT 1 FROM salespeople WHERE user_id = auth.uid()
));

-- Políticas para salesperson_portfolio_evaluations
CREATE POLICY "Master admins can manage portfolio evaluations"
ON public.salesperson_portfolio_evaluations FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Salespeople can view their own evaluations"
ON public.salesperson_portfolio_evaluations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM salespeople WHERE id = salesperson_portfolio_evaluations.salesperson_id AND user_id = auth.uid()
));

-- Inserir configuração padrão
INSERT INTO public.salesperson_activity_rules (
  evaluation_period,
  tier_full_commission,
  tier_reduced_commission,
  tier_minimum_commission,
  full_commission_percentage,
  reduced_commission_percentage,
  minimum_commission_percentage,
  grace_period_days,
  notify_days_before,
  allow_reactivation,
  reactivation_requires_new_sale,
  is_active
) VALUES (
  'quarterly',
  10,
  5,
  1,
  100,
  80,
  50,
  30,
  15,
  true,
  false,
  true
);

-- Trigger para updated_at
CREATE TRIGGER update_salesperson_activity_rules_updated_at
BEFORE UPDATE ON public.salesperson_activity_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();