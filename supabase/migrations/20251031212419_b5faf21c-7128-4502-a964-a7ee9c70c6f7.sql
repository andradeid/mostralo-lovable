-- Criar enum para tipo de pagamento
CREATE TYPE payment_type AS ENUM ('fixed', 'commission');

-- Tabela de configuração de pagamento dos entregadores
CREATE TABLE driver_earnings_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  payment_type payment_type NOT NULL DEFAULT 'fixed',
  fixed_amount NUMERIC(10,2),
  commission_percentage NUMERIC(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(driver_id, store_id)
);

-- Tabela de ganhos dos entregadores
CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_assignment_id UUID REFERENCES delivery_assignments(id) ON DELETE SET NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  earnings_amount NUMERIC(10,2) NOT NULL,
  payment_type payment_type NOT NULL,
  commission_percentage NUMERIC(5,2),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  delivered_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_driver_earnings_driver ON driver_earnings(driver_id);
CREATE INDEX idx_driver_earnings_store ON driver_earnings(store_id);
CREATE INDEX idx_driver_earnings_status ON driver_earnings(payment_status);
CREATE INDEX idx_driver_earnings_delivered ON driver_earnings(delivered_at);

-- RLS para driver_earnings_config
ALTER TABLE driver_earnings_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas podem gerenciar config dos seus entregadores"
ON driver_earnings_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = driver_earnings_config.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Entregadores podem ver sua própria config"
ON driver_earnings_config FOR SELECT
USING (driver_id = auth.uid());

-- RLS para driver_earnings
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas podem ver ganhos dos seus entregadores"
ON driver_earnings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = driver_earnings.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Lojistas podem atualizar status de pagamento"
ON driver_earnings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = driver_earnings.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Entregadores podem ver seus próprios ganhos"
ON driver_earnings FOR SELECT
USING (driver_id = auth.uid());

CREATE POLICY "Sistema pode inserir ganhos"
ON driver_earnings FOR INSERT
WITH CHECK (true);

-- Função para calcular ganhos automaticamente
CREATE OR REPLACE FUNCTION calculate_driver_earnings()
RETURNS TRIGGER AS $$
DECLARE
  v_order RECORD;
  v_config RECORD;
  v_earnings NUMERIC;
BEGIN
  -- Apenas processar quando status mudar para 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Buscar informações do pedido
    SELECT id, delivery_fee, store_id 
    INTO v_order
    FROM orders 
    WHERE id = NEW.order_id;
    
    -- Buscar configuração do entregador
    SELECT * INTO v_config
    FROM driver_earnings_config
    WHERE driver_id = NEW.delivery_driver_id 
    AND store_id = NEW.store_id
    AND is_active = true;
    
    -- Calcular ganho
    IF v_config IS NULL OR v_config.payment_type = 'fixed' THEN
      v_earnings := COALESCE(v_config.fixed_amount, v_order.delivery_fee);
    ELSE
      v_earnings := v_order.delivery_fee * (COALESCE(v_config.commission_percentage, 100) / 100);
    END IF;
    
    -- Registrar ganho
    INSERT INTO driver_earnings (
      driver_id,
      store_id,
      order_id,
      delivery_assignment_id,
      delivery_fee,
      earnings_amount,
      payment_type,
      commission_percentage,
      delivered_at
    ) VALUES (
      NEW.delivery_driver_id,
      NEW.store_id,
      NEW.order_id,
      NEW.id,
      v_order.delivery_fee,
      v_earnings,
      COALESCE(v_config.payment_type, 'fixed'::payment_type),
      v_config.commission_percentage,
      COALESCE(NEW.delivered_at, now())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para calcular ganhos
CREATE TRIGGER trigger_calculate_driver_earnings
AFTER UPDATE ON delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION calculate_driver_earnings();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_driver_earnings_config_updated_at
BEFORE UPDATE ON driver_earnings_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_earnings_updated_at
BEFORE UPDATE ON driver_earnings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();