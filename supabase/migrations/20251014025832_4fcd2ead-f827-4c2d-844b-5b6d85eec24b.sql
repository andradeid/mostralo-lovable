-- Criar tabela customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(store_id, phone)
);

-- Índices para performance
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Adicionar customer_id na tabela orders
ALTER TABLE orders 
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- RLS Policies para customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Donos das lojas podem ver seus clientes
CREATE POLICY "Store owners can view their customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Donos das lojas podem gerenciar seus clientes
CREATE POLICY "Store owners can manage their customers"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  );

-- Master admins podem ver todos os clientes
CREATE POLICY "Master admins can view all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'master_admin'
    )
  );

-- Público pode criar clientes (durante checkout)
CREATE POLICY "Public can create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Público pode atualizar clientes (durante checkout)
CREATE POLICY "Public can update customers"
  ON customers FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET 
        total_orders = (
          SELECT COUNT(*) 
          FROM orders 
          WHERE customer_id = NEW.customer_id
        ),
        total_spent = (
          SELECT COALESCE(SUM(total), 0) 
          FROM orders 
          WHERE customer_id = NEW.customer_id 
          AND status NOT IN ('cancelado')
        ),
        last_order_at = NEW.created_at
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar estatísticas
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();