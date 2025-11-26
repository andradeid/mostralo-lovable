-- 1. Criar enum app_role
CREATE TYPE public.app_role AS ENUM ('master_admin', 'store_admin', 'customer');

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, role, store_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_store_id ON public.user_roles(store_id);

-- 3. Adicionar campo auth_user_id na tabela customers
ALTER TABLE public.customers 
ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);

-- 4. Criar função has_role (Security Definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Criar função has_role_in_store
CREATE OR REPLACE FUNCTION public.has_role_in_store(_user_id uuid, _role app_role, _store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (store_id = _store_id OR store_id IS NULL)
  )
$$;

-- 6. RLS Policies para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Store admins can manage customer roles in their store"
ON public.user_roles FOR ALL
TO authenticated
USING (
  role = 'customer' AND
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = user_roles.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- 7. Atualizar RLS da tabela customers para clientes
CREATE POLICY "Customers can view their own data"
ON public.customers FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update their own data"
ON public.customers FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 8. Atualizar RLS da tabela orders para clientes
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- 9. RLS para order_items (clientes podem ver itens dos seus pedidos)
CREATE POLICY "Customers can view their own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.id = order_items.order_id
    AND c.auth_user_id = auth.uid()
  )
);

-- 10. RLS para order_addons (clientes podem ver addons dos seus pedidos)
CREATE POLICY "Customers can view their own order addons"
ON public.order_addons FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    WHERE oi.id = order_addons.order_item_id
    AND c.auth_user_id = auth.uid()
  )
);

-- 11. Criar trigger para criar usuário auth quando cliente é cadastrado
CREATE OR REPLACE FUNCTION public.create_customer_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  temp_email text;
BEGIN
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
    
    -- Criar role de customer
    INSERT INTO public.user_roles (user_id, role, store_id)
    VALUES (new_user_id, 'customer', NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger (apenas para novos clientes sem auth_user_id)
CREATE TRIGGER create_customer_auth_on_insert
BEFORE INSERT ON public.customers
FOR EACH ROW
WHEN (NEW.auth_user_id IS NULL)
EXECUTE FUNCTION public.create_customer_auth_user();