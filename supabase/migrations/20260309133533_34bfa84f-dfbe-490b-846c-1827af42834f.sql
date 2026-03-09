-- FIX: Permitir atendentes verem outros atendentes/admins da mesma loja

-- 1. Expandir política de user_roles para incluir atendentes
DROP POLICY IF EXISTS "user_roles_select_expanded" ON public.user_roles;

CREATE POLICY "user_roles_select_expanded"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'master_admin'::app_role)
    OR (store_id IS NOT NULL AND is_store_owner_direct(store_id, auth.uid()))
    OR (store_id IS NOT NULL AND is_attendant_of_store_direct(store_id, auth.uid()))
  );

-- 2. Permitir atendentes verem perfis de colegas da mesma loja
DROP POLICY IF EXISTS "Attendants can view coworker profiles" ON public.profiles;

CREATE POLICY "Attendants can view coworker profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur_self
      JOIN public.user_roles ur_target ON ur_self.store_id = ur_target.store_id
      WHERE ur_self.user_id = auth.uid()
        AND ur_self.role = 'attendant'
        AND ur_target.user_id = profiles.id
    )
  );