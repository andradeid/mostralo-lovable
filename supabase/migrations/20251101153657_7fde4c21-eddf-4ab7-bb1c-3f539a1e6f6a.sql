-- Ajustar RLS de user_roles para permitir master_admin gerenciar todos os roles
-- Removendo políticas antigas que dependem de has_role para admin

DROP POLICY IF EXISTS "Master admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON public.user_roles;

-- Criar políticas baseadas em get_current_user_type() para master_admin

-- Master admin pode ler todos os roles
CREATE POLICY "user_roles_select_master_admin"
  ON public.user_roles
  FOR SELECT
  USING (get_current_user_type() = 'master_admin');

-- Master admin pode gerenciar todos os roles (INSERT, UPDATE, DELETE)
CREATE POLICY "user_roles_admin_manage_all"
  ON public.user_roles
  FOR ALL
  USING (get_current_user_type() = 'master_admin');

-- Usuários podem ver seus próprios roles (política já existente, mantemos)
CREATE POLICY "user_roles_select_self" 
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());