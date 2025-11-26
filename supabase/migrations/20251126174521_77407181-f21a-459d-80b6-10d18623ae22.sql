-- =====================================================
-- FIX: Remover políticas recursivas e criar políticas corretas
-- =====================================================

-- 1. REMOVER políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "store_admin_can_view_store_attendants" ON public.user_roles;
DROP POLICY IF EXISTS "store_admin_can_manage_store_attendants" ON public.user_roles;

-- 2. CRIAR políticas CORRETAS (sem recursão)
-- Política para store admins VEREM atendentes (SELECT)
CREATE POLICY "store_admin_view_attendants_fixed"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    -- Store admins podem ver atendentes da sua loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
    )
  );

-- Política para store admins GERENCIAREM atendentes (INSERT/UPDATE/DELETE)
CREATE POLICY "store_admin_manage_attendants_fixed"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    -- Pode gerenciar atendentes da sua loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Garantir que só podem criar/atualizar atendentes para a própria loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
    )
  );