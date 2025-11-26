-- =====================================================
-- FIX: Expandir política de SELECT em user_roles para permitir
-- que master_admins e store_owners vejam roles da sua loja
-- =====================================================

-- Remover política restritiva atual
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_store_admin_view_attendants" ON public.user_roles;

-- Criar política expandida que permite:
-- 1. Ver suas próprias roles
-- 2. Master admins ver todas as roles
-- 3. Store owners ver roles da sua loja
CREATE POLICY "user_roles_select_expanded"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    -- Ver próprias roles
    user_id = auth.uid()
    -- OU master admin pode ver tudo
    OR has_role(auth.uid(), 'master_admin'::app_role)
    -- OU store owner pode ver roles da sua loja
    OR (store_id IS NOT NULL AND is_store_owner_direct(store_id, auth.uid()))
  );