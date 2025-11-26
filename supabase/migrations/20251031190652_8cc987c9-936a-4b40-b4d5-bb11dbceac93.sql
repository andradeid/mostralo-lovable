-- Migration 2: Criar estrutura completa de delivery_assignments e policies

-- 1. Criar tabela delivery_assignments
CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(order_id)
);

-- Índices para performance
CREATE INDEX idx_delivery_assignments_driver ON delivery_assignments(delivery_driver_id);
CREATE INDEX idx_delivery_assignments_store ON delivery_assignments(store_id);
CREATE INDEX idx_delivery_assignments_status ON delivery_assignments(status);

-- 2. Adicionar campo assigned_driver_id em orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver_id);

-- 3. Criar função is_delivery_driver
CREATE OR REPLACE FUNCTION is_delivery_driver(
  _user_id UUID,
  _store_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = 'delivery_driver'
      AND store_id = _store_id
  )
$$;

-- 4. RLS para delivery_assignments
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entregadores podem ver suas atribuições"
  ON delivery_assignments FOR SELECT
  TO authenticated
  USING (
    delivery_driver_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'delivery_driver'
    )
  );

CREATE POLICY "Donos podem ver atribuições da loja"
  ON delivery_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = delivery_assignments.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Donos podem criar atribuições"
  ON delivery_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = delivery_assignments.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Entregadores podem atualizar suas atribuições"
  ON delivery_assignments FOR UPDATE
  TO authenticated
  USING (
    delivery_driver_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role = 'delivery_driver'
    )
  );

CREATE POLICY "Donos podem atualizar atribuições da loja"
  ON delivery_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = delivery_assignments.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Master admins podem gerenciar atribuições"
  ON delivery_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'master_admin'
    )
  );

-- 5. RLS adicional em orders para entregadores
CREATE POLICY "Entregadores podem ver pedidos disponíveis e seus"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (assigned_driver_id = auth.uid()) OR
    (
      assigned_driver_id IS NULL AND
      status IN ('aguarda_retirada', 'em_transito') AND
      delivery_type = 'delivery' AND
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'delivery_driver'
        AND store_id = orders.store_id
      )
    )
  );

CREATE POLICY "Entregadores podem atualizar seus pedidos"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    assigned_driver_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'delivery_driver'
    )
  )
  WITH CHECK (
    assigned_driver_id = auth.uid()
  );