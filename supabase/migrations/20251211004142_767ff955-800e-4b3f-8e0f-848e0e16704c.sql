-- Adicionar novos campos na tabela salespeople para suportar dois tipos de vendedor
ALTER TABLE salespeople
ADD COLUMN IF NOT EXISTS salesperson_type TEXT NOT NULL DEFAULT 'partner' CHECK (salesperson_type IN ('affiliate', 'partner')),
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS monthly_earnings_limit NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_month_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_eligible BOOLEAN DEFAULT true;

-- Tornar CNPJ e company_name opcionais (antes eram obrigatórios)
ALTER TABLE salespeople ALTER COLUMN cnpj DROP NOT NULL;
ALTER TABLE salespeople ALTER COLUMN company_name DROP NOT NULL;

-- Criar índice para CPF
CREATE INDEX IF NOT EXISTS idx_salespeople_cpf ON salespeople(cpf) WHERE cpf IS NOT NULL;

-- Criar índice para tipo de vendedor
CREATE INDEX IF NOT EXISTS idx_salespeople_type ON salespeople(salesperson_type);

-- Criar tabela para aceite de termos
CREATE TABLE IF NOT EXISTS salesperson_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID NOT NULL REFERENCES salespeople(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  terms_type TEXT NOT NULL CHECK (terms_type IN ('affiliate_terms', 'partner_contract')),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na nova tabela
ALTER TABLE salesperson_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para salesperson_terms_acceptance
CREATE POLICY "Salespeople can view their own terms acceptance"
ON salesperson_terms_acceptance FOR SELECT
USING (salesperson_id IN (SELECT id FROM salespeople WHERE user_id = auth.uid()));

CREATE POLICY "System can insert terms acceptance"
ON salesperson_terms_acceptance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Master admins can view all terms acceptance"
ON salesperson_terms_acceptance FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Função para verificar limite mensal de afiliados
CREATE OR REPLACE FUNCTION check_affiliate_monthly_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_salesperson RECORD;
  v_current_month_total NUMERIC;
BEGIN
  -- Buscar dados do vendedor
  SELECT * INTO v_salesperson FROM salespeople WHERE id = NEW.salesperson_id;
  
  -- Se for afiliado, verificar limite
  IF v_salesperson.salesperson_type = 'affiliate' THEN
    -- Calcular total do mês atual
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_current_month_total
    FROM salesperson_commissions
    WHERE salesperson_id = NEW.salesperson_id
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Verificar se excede limite (R$ 1.900)
    IF (v_current_month_total + NEW.commission_amount) > 1900 THEN
      RAISE EXCEPTION 'Limite mensal de R$ 1.900 atingido para afiliados. Faça upgrade para Parceiro PJ para ganhos ilimitados.';
    END IF;
    
    -- Atualizar ganhos do mês atual
    UPDATE salespeople 
    SET current_month_earnings = v_current_month_total + NEW.commission_amount
    WHERE id = NEW.salesperson_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para verificar limite (apenas se tabela salesperson_commissions existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salesperson_commissions') THEN
    DROP TRIGGER IF EXISTS affiliate_monthly_limit_check ON salesperson_commissions;
    CREATE TRIGGER affiliate_monthly_limit_check
    BEFORE INSERT ON salesperson_commissions
    FOR EACH ROW EXECUTE FUNCTION check_affiliate_monthly_limit();
  END IF;
END $$;

-- Função para resetar ganhos mensais no início de cada mês
CREATE OR REPLACE FUNCTION reset_affiliate_monthly_earnings()
RETURNS void AS $$
BEGIN
  UPDATE salespeople 
  SET current_month_earnings = 0
  WHERE salesperson_type = 'affiliate';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar vendedores existentes como 'partner' (já eram PJ)
UPDATE salespeople 
SET salesperson_type = 'partner', 
    bonus_eligible = true,
    monthly_earnings_limit = NULL
WHERE salesperson_type = 'partner' OR salesperson_type IS NULL;