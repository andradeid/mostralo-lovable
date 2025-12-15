-- Passo 1: Adicionar constraint de unicidade (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_payout_cycle'
  ) THEN
    ALTER TABLE salesperson_payouts 
    ADD CONSTRAINT unique_payout_cycle 
    UNIQUE (salesperson_id, cycle_month, cycle_year);
  END IF;
END $$;

-- Passo 2: Inserir registro retroativo para comissões já pagas
INSERT INTO salesperson_payouts (
  salesperson_id,
  cycle_month,
  cycle_year,
  total_sales,
  commission_total,
  bonus_total,
  grand_total,
  status,
  pix_key,
  pix_key_type,
  requested_at,
  paid_at
)
SELECT 
  sc.salesperson_id,
  EXTRACT(MONTH FROM sc.created_at)::int,
  EXTRACT(YEAR FROM sc.created_at)::int,
  COUNT(*),
  SUM(sc.commission_amount),
  0,
  SUM(sc.commission_amount),
  'paid',
  s.pix_key,
  s.pix_key_type,
  MIN(sc.created_at),
  MAX(sc.paid_at)
FROM salesperson_commissions sc
JOIN salespeople s ON s.id = sc.salesperson_id
WHERE sc.status = 'paid'
GROUP BY sc.salesperson_id, EXTRACT(MONTH FROM sc.created_at), EXTRACT(YEAR FROM sc.created_at), s.pix_key, s.pix_key_type
ON CONFLICT (salesperson_id, cycle_month, cycle_year) DO NOTHING;

-- Passo 3: Atualizar o trigger para também criar/atualizar salesperson_payouts
CREATE OR REPLACE FUNCTION public.calculate_salesperson_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        
        -- NOVO: Criar/atualizar registro em salesperson_payouts
        INSERT INTO salesperson_payouts (
          salesperson_id, 
          cycle_month, 
          cycle_year, 
          total_sales, 
          commission_total, 
          bonus_total,
          grand_total, 
          status,
          pix_key,
          pix_key_type
        )
        SELECT 
          NEW.referred_by_salesperson_id,
          EXTRACT(MONTH FROM NOW())::int,
          EXTRACT(YEAR FROM NOW())::int,
          1,
          v_commission_amount,
          0,
          v_commission_amount,
          'available',
          s.pix_key,
          s.pix_key_type
        FROM salespeople s
        WHERE s.id = NEW.referred_by_salesperson_id
        ON CONFLICT (salesperson_id, cycle_month, cycle_year)
        DO UPDATE SET
          total_sales = salesperson_payouts.total_sales + 1,
          commission_total = salesperson_payouts.commission_total + v_commission_amount,
          grand_total = salesperson_payouts.grand_total + v_commission_amount,
          updated_at = NOW();
        
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
        
        -- NOVO: Criar/atualizar registro em salesperson_payouts
        INSERT INTO salesperson_payouts (
          salesperson_id, 
          cycle_month, 
          cycle_year, 
          total_sales, 
          commission_total, 
          bonus_total,
          grand_total, 
          status,
          pix_key,
          pix_key_type
        )
        SELECT 
          NEW.referred_by_salesperson_id,
          EXTRACT(MONTH FROM NOW())::int,
          EXTRACT(YEAR FROM NOW())::int,
          1,
          v_commission_amount,
          0,
          v_commission_amount,
          'available',
          s.pix_key,
          s.pix_key_type
        FROM salespeople s
        WHERE s.id = NEW.referred_by_salesperson_id
        ON CONFLICT (salesperson_id, cycle_month, cycle_year)
        DO UPDATE SET
          total_sales = salesperson_payouts.total_sales + 1,
          commission_total = salesperson_payouts.commission_total + v_commission_amount,
          grand_total = salesperson_payouts.grand_total + v_commission_amount,
          updated_at = NOW();
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;