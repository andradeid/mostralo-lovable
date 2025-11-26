-- ============================================
-- MIGRAÇÃO PARA ARQUITETURA MULTI-LOJA (V2)
-- Cliente global: 1 conta = todos os pedidos de todas as lojas
-- ============================================

-- 1. Criar tabela de relacionamento N:N entre clientes e lojas
CREATE TABLE IF NOT EXISTS public.customer_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  first_order_at timestamptz DEFAULT now(),
  last_order_at timestamptz,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, store_id)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_customer_stores_customer_id ON public.customer_stores(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_stores_store_id ON public.customer_stores(store_id);

-- 3. Migrar dados existentes: copiar informações de customers para customer_stores
INSERT INTO public.customer_stores (customer_id, store_id, total_orders, total_spent, last_order_at, first_order_at)
SELECT 
  id,
  store_id,
  COALESCE(total_orders, 0),
  COALESCE(total_spent, 0),
  last_order_at,
  created_at
FROM public.customers
WHERE store_id IS NOT NULL
ON CONFLICT (customer_id, store_id) DO NOTHING;

-- 4. Criar índice único para telefone (clientes globais)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique ON public.customers(phone);

-- 5. Dropar TODAS as políticas RLS existentes de customers
DROP POLICY IF EXISTS "Store owners can view their customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can manage their customers" ON public.customers;
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;
DROP POLICY IF EXISTS "Public can update customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can view their own data" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON public.customers;
DROP POLICY IF EXISTS "Master admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can view their store customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can update their store customers" ON public.customers;

-- 6. Atualizar constraint de customer_stores para referenciar customers
ALTER TABLE public.customer_stores 
DROP CONSTRAINT IF EXISTS customer_stores_customer_id_fkey;

ALTER TABLE public.customer_stores
ADD CONSTRAINT customer_stores_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- 7. Remover store_id da tabela customers (agora é global)
ALTER TABLE public.customers DROP COLUMN IF EXISTS store_id CASCADE;

-- 8. Atualizar trigger de estatísticas para usar customer_stores
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.customer_id IS NOT NULL AND NEW.store_id IS NOT NULL THEN
      -- Atualizar estatísticas na tabela customer_stores
      INSERT INTO customer_stores (customer_id, store_id, total_orders, total_spent, last_order_at, first_order_at)
      VALUES (
        NEW.customer_id,
        NEW.store_id,
        1,
        CASE WHEN NEW.status NOT IN ('cancelado') THEN NEW.total ELSE 0 END,
        NEW.created_at,
        NEW.created_at
      )
      ON CONFLICT (customer_id, store_id) 
      DO UPDATE SET
        total_orders = (
          SELECT COUNT(*) 
          FROM orders 
          WHERE customer_id = NEW.customer_id 
          AND store_id = NEW.store_id
        ),
        total_spent = (
          SELECT COALESCE(SUM(total), 0) 
          FROM orders 
          WHERE customer_id = NEW.customer_id 
          AND store_id = NEW.store_id
          AND status NOT IN ('cancelado')
        ),
        last_order_at = NEW.created_at,
        updated_at = now();
        
      -- Atualizar também na tabela customers (totais globais)
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
$$;

-- 9. Atualizar trigger de criação de auth user para clientes globais
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id uuid;
  temp_email text;
BEGIN
  -- Só criar se não tiver auth_user_id
  IF NEW.auth_user_id IS NULL THEN
    -- Gerar email temporário baseado no telefone
    temp_email := 'cliente_' || NEW.phone || '@temp.mostralo.com';
    
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      role,
      aud
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      temp_email,
      crypt('102030', gen_salt('bf')),
      now(),
      jsonb_build_object('full_name', NEW.name, 'phone', NEW.phone),
      'authenticated',
      'authenticated'
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO new_user_id;
    
    -- Se usuário foi criado, atualizar customer
    IF new_user_id IS NOT NULL THEN
      NEW.auth_user_id := new_user_id;
      
      -- Criar role de customer (sem store_id específico, é global)
      INSERT INTO public.user_roles (user_id, role)
      VALUES (new_user_id, 'customer')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Enable RLS em customer_stores
ALTER TABLE public.customer_stores ENABLE ROW LEVEL SECURITY;

-- 11. Dropar e recriar políticas RLS para customer_stores
DROP POLICY IF EXISTS "Customers can view their own store relationships" ON public.customer_stores;
DROP POLICY IF EXISTS "Store owners can view their customer relationships" ON public.customer_stores;
DROP POLICY IF EXISTS "Master admins can view all customer relationships" ON public.customer_stores;

CREATE POLICY "Customers can view their own store relationships"
ON public.customer_stores
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Store owners can view their customer relationships"
ON public.customer_stores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = customer_stores.store_id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Master admins can view all customer relationships"
ON public.customer_stores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- 12. Criar novas políticas RLS para customers (agora é global)
CREATE POLICY "Public can create customers"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Customers can view their own data"
ON public.customers
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update their own data"
ON public.customers
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Store owners can view their store customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customer_stores
    JOIN stores ON stores.id = customer_stores.store_id
    WHERE customer_stores.customer_id = customers.id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their store customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM customer_stores
    JOIN stores ON stores.id = customer_stores.store_id
    WHERE customer_stores.customer_id = customers.id
    AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customer_stores
    JOIN stores ON stores.id = customer_stores.store_id
    WHERE customer_stores.customer_id = customers.id
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Master admins can view all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- 13. Atualizar políticas de orders para funcionar com clientes globais
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 14. Trigger para atualizar updated_at em customer_stores
CREATE OR REPLACE FUNCTION public.update_customer_stores_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_customer_stores_updated_at ON public.customer_stores;

CREATE TRIGGER update_customer_stores_updated_at
BEFORE UPDATE ON public.customer_stores
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_stores_updated_at();