-- =====================================================
-- FIX: Permitir store admins verem atendentes da sua loja
-- =====================================================

-- Adicionar política para store admins verem atendentes
CREATE POLICY "store_admin_can_view_store_attendants"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    -- Store admins podem ver atendentes (role='attendant') da sua loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 
      FROM public.stores s
      INNER JOIN public.user_roles ur ON ur.store_id = s.id
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
        AND ur.user_id = auth.uid()
        AND ur.role = 'store_admin'
    )
  );

-- Adicionar política para store admins gerenciarem atendentes
CREATE POLICY "store_admin_can_manage_store_attendants"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    -- Store admins podem gerenciar atendentes (INSERT/UPDATE/DELETE) da sua loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 
      FROM public.stores s
      INNER JOIN public.user_roles ur ON ur.store_id = s.id
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
        AND ur.user_id = auth.uid()
        AND ur.role = 'store_admin'
    )
  )
  WITH CHECK (
    -- Garantir que só podem criar/atualizar atendentes para a própria loja
    role = 'attendant'
    AND EXISTS (
      SELECT 1 
      FROM public.stores s
      INNER JOIN public.user_roles ur ON ur.store_id = s.id
      WHERE s.id = user_roles.store_id
        AND s.owner_id = auth.uid()
        AND ur.user_id = auth.uid()
        AND ur.role = 'store_admin'
    )
  );