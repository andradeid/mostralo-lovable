-- Criar tabela de comissões dos vendedores
CREATE TABLE public.salesperson_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID NOT NULL REFERENCES salespeople(id) ON DELETE CASCADE,
  payment_approval_id UUID NOT NULL REFERENCES payment_approvals(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  
  -- Dados do pagamento original
  payment_amount NUMERIC NOT NULL,
  plan_name TEXT,
  store_name TEXT,
  
  -- Cálculo da comissão
  commission_type TEXT NOT NULL,
  commission_percentage NUMERIC,
  commission_fixed_amount NUMERIC,
  commission_amount NUMERIC NOT NULL,
  
  -- Status do pagamento da comissão
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by UUID,
  payment_reference TEXT,
  
  -- Tipo de aplicação
  payment_sequence INTEGER DEFAULT 1,
  applies_to TEXT NOT NULL,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_commission_per_payment UNIQUE (salesperson_id, payment_approval_id)
);

-- Habilitar RLS
ALTER TABLE public.salesperson_commissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Master admins can manage all commissions"
ON public.salesperson_commissions FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Salespeople can view their own commissions"
ON public.salesperson_commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM salespeople s
    WHERE s.id = salesperson_commissions.salesperson_id
    AND s.user_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX idx_salesperson_commissions_salesperson ON public.salesperson_commissions(salesperson_id);
CREATE INDEX idx_salesperson_commissions_status ON public.salesperson_commissions(status);
CREATE INDEX idx_salesperson_commissions_created ON public.salesperson_commissions(created_at DESC);

-- Função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION public.calculate_salesperson_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_commission_amount NUMERIC;
  v_payment_sequence INTEGER;
  v_store_name TEXT;
  v_plan_name TEXT;
BEGIN
  -- Apenas processar quando status mudar para 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Verificar se tem vendedor vinculado
    IF NEW.referred_by_salesperson_id IS NOT NULL THEN
      
      -- Buscar configuração de comissão do vendedor
      SELECT * INTO v_config
      FROM salesperson_commission_configs
      WHERE salesperson_id = NEW.referred_by_salesperson_id;
      
      -- Se não tem config, criar comissão padrão de 10%
      IF v_config IS NULL THEN
        v_commission_amount := NEW.payment_amount * 0.10;
        
        -- Buscar nome da loja e plano
        SELECT s.name INTO v_store_name
        FROM stores s WHERE s.id = NEW.store_id;
        
        SELECT p.name INTO v_plan_name
        FROM plans p WHERE p.id = NEW.plan_id;
        
        -- Inserir comissão padrão
        INSERT INTO salesperson_commissions (
          salesperson_id, payment_approval_id, store_id,
          payment_amount, plan_name, store_name,
          commission_type, commission_percentage,
          commission_amount, payment_sequence, applies_to
        ) VALUES (
          NEW.referred_by_salesperson_id, NEW.id, NEW.store_id,
          NEW.payment_amount, v_plan_name, v_store_name,
          'percentage', 10,
          v_commission_amount, 1, 'all'
        )
        ON CONFLICT (salesperson_id, payment_approval_id) DO NOTHING;
        
        RETURN NEW;
      END IF;
      
      -- Contar sequência de pagamentos deste cliente/loja
      SELECT COUNT(*) + 1 INTO v_payment_sequence
      FROM payment_approvals
      WHERE store_id = NEW.store_id
      AND status = 'approved'
      AND id != NEW.id;
      
      -- Verificar se aplica a este tipo de pagamento
      IF (v_config.applies_to = 'all') OR
         (v_config.applies_to = 'first_payment' AND v_payment_sequence = 1) OR
         (v_config.applies_to = 'recurring') THEN
        
        -- Calcular valor da comissão
        IF v_config.commission_type = 'percentage' THEN
          v_commission_amount := NEW.payment_amount * (v_config.commission_value / 100);
        ELSE
          v_commission_amount := v_config.commission_value;
        END IF;
        
        -- Buscar nome da loja e plano
        SELECT s.name INTO v_store_name
        FROM stores s WHERE s.id = NEW.store_id;
        
        SELECT p.name INTO v_plan_name
        FROM plans p WHERE p.id = NEW.plan_id;
        
        -- Inserir registro de comissão
        INSERT INTO salesperson_commissions (
          salesperson_id, payment_approval_id, store_id,
          payment_amount, plan_name, store_name,
          commission_type, commission_percentage, commission_fixed_amount,
          commission_amount, payment_sequence, applies_to
        ) VALUES (
          NEW.referred_by_salesperson_id, NEW.id, NEW.store_id,
          NEW.payment_amount, v_plan_name, v_store_name,
          v_config.commission_type,
          CASE WHEN v_config.commission_type = 'percentage' THEN v_config.commission_value ELSE NULL END,
          CASE WHEN v_config.commission_type = 'fixed' THEN v_config.commission_value ELSE NULL END,
          v_commission_amount, v_payment_sequence, v_config.applies_to
        )
        ON CONFLICT (salesperson_id, payment_approval_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela payment_approvals
CREATE TRIGGER trg_calculate_salesperson_commission
AFTER UPDATE ON public.payment_approvals
FOR EACH ROW
EXECUTE FUNCTION public.calculate_salesperson_commission();

-- Trigger para updated_at
CREATE TRIGGER update_salesperson_commissions_updated_at
BEFORE UPDATE ON public.salesperson_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();