-- =====================================================
-- FIX DEFINITIVO: Quebrar ciclo de recursão entre stores e user_roles
-- =====================================================

-- 1. CRIAR FUNÇÕES SECURITY DEFINER para quebrar recursão
-- Estas funções consultam diretamente o banco SEM passar pelo RLS

-- Função para verificar se usuário é dono da loja (SEM RLS)
CREATE OR REPLACE FUNCTION public.is_store_owner_direct(check_store_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = check_store_id
      AND owner_id = check_user_id
  );
$$;

-- Função para pegar store_ids do usuário (SEM RLS)
CREATE OR REPLACE FUNCTION public.get_user_store_ids_direct(check_user_id uuid)
RETURNS TABLE(store_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_roles
  WHERE user_id = check_user_id
    AND store_id IS NOT NULL;
$$;

-- Função para verificar se é atendente de uma loja (SEM RLS)
CREATE OR REPLACE FUNCTION public.is_attendant_of_store_direct(check_store_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'attendant'
      AND store_id = check_store_id
  );
$$;

-- 2. REMOVER TODAS as políticas recursivas de user_roles
DROP POLICY IF EXISTS "delete_roles" ON public.user_roles;
DROP POLICY IF EXISTS "insert_roles" ON public.user_roles;
DROP POLICY IF EXISTS "update_roles" ON public.user_roles;
DROP POLICY IF EXISTS "store_admin_view_attendants_fixed" ON public.user_roles;
DROP POLICY IF EXISTS "store_admin_manage_attendants_fixed" ON public.user_roles;

-- 3. CRIAR POLÍTICAS CORRETAS em user_roles (usando funções security definer)
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_insert_by_owner"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'master_admin'::app_role)
    OR is_store_owner_direct(store_id, auth.uid())
  );

CREATE POLICY "user_roles_update_by_owner"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'master_admin'::app_role)
    OR is_store_owner_direct(store_id, auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'master_admin'::app_role)
    OR is_store_owner_direct(store_id, auth.uid())
  );

CREATE POLICY "user_roles_delete_by_owner"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'master_admin'::app_role)
    OR is_store_owner_direct(store_id, auth.uid())
  );

-- Política especial para store admins verem atendentes
CREATE POLICY "user_roles_store_admin_view_attendants"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    role = 'attendant'
    AND is_store_owner_direct(store_id, auth.uid())
  );

-- 4. REMOVER política recursiva de stores
DROP POLICY IF EXISTS "Attendants can view their store" ON public.stores;

-- 5. RECRIAR política de stores usando função security definer
CREATE POLICY "stores_attendants_can_view"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (
    is_attendant_of_store_direct(id, auth.uid())
  );