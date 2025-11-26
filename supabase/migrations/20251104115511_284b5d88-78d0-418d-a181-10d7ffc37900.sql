-- Adicionar novos campos à tabela driver_earnings
ALTER TABLE driver_earnings
ADD COLUMN payment_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_request_count INTEGER DEFAULT 0;

-- Criar tabela payment_requests
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  earning_ids UUID[] NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_payment_requests_driver_id ON payment_requests(driver_id);
CREATE INDEX idx_payment_requests_store_id ON payment_requests(store_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_requested_at ON payment_requests(requested_at DESC);

-- Habilitar RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Entregadores podem ver suas próprias solicitações
CREATE POLICY "Entregadores podem ver suas solicitações"
ON payment_requests
FOR SELECT
TO authenticated
USING (driver_id = auth.uid());

-- RLS: Entregadores podem criar solicitações
CREATE POLICY "Entregadores podem criar solicitações"
ON payment_requests
FOR INSERT
TO authenticated
WITH CHECK (
  driver_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'delivery_driver'
  )
);

-- RLS: Lojistas podem ver solicitações da sua loja
CREATE POLICY "Lojistas podem ver solicitações da loja"
ON payment_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = payment_requests.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- RLS: Lojistas podem atualizar solicitações da sua loja
CREATE POLICY "Lojistas podem atualizar solicitações"
ON payment_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = payment_requests.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- RLS: Master admins podem ver tudo
CREATE POLICY "Master admins podem ver todas solicitações"
ON payment_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master_admin'));

-- Trigger para updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON payment_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;