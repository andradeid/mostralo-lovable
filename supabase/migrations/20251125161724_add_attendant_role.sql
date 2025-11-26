-- Migration: Adicionar 'attendant' ao enum app_role
-- Atendentes terão acesso limitado apenas à loja específica vinculada

-- 1. Adicionar 'attendant' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'attendant';

-- 2. Criar RLS Policy para atendentes verem suas próprias roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Attendants can view their own roles'
  ) THEN
    CREATE POLICY "Attendants can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid() 
      AND role = 'attendant'
    );
  END IF;
END $$;

-- 3. Criar RLS Policy para store_admins gerenciarem atendentes de suas lojas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Store admins can manage attendants in their store'
  ) THEN
    CREATE POLICY "Store admins can manage attendants in their store"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'store_admin')
      AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = user_roles.store_id
          AND s.owner_id = auth.uid()
      )
      AND user_roles.role = 'attendant'
    );
  END IF;
END $$;

-- 4. Criar RLS Policy para master_admins gerenciarem todos os atendentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Master admins can manage all attendants'
  ) THEN
    CREATE POLICY "Master admins can manage all attendants"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (
      has_role(auth.uid(), 'master_admin')
      AND user_roles.role = 'attendant'
    );
  END IF;
END $$;

-- 5. Atualizar função has_role_in_store para incluir attendant
-- (A função já funciona para qualquer role, então não precisa de alteração)

-- 6. Comentário explicativo
COMMENT ON TYPE app_role IS 'Roles do sistema: master_admin (acesso total), store_admin (dono da loja), attendant (atendente da loja), delivery_driver (entregador), customer (cliente)';

