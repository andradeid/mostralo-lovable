-- Criar tabela de informações de pagamento do entregador
CREATE TABLE driver_payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(driver_id)
);

-- RLS Policies
ALTER TABLE driver_payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entregadores podem ver e gerenciar suas próprias infos"
ON driver_payment_info FOR ALL
USING (driver_id = auth.uid());

CREATE POLICY "Lojistas podem ver infos dos seus entregadores"
ON driver_payment_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN stores s ON s.id = ur.store_id
    WHERE ur.user_id = driver_payment_info.driver_id
      AND ur.role = 'delivery_driver'
      AND s.owner_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_driver_payment_info_updated_at
  BEFORE UPDATE ON driver_payment_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();