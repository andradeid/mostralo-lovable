-- Ajuste de RLS para corrigir acesso ao painel
-- 1) PERFIS: remover políticas antigas e recriar como permissivas e específicas
DROP POLICY IF EXISTS "Active users and master admins can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to demo profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Store owners can update their delivery drivers profiles" ON public.profiles;
DROP POLICY IF EXISTS "Store owners can view their delivery drivers profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "profile_select_self"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profile_select_master_admin"
  ON public.profiles
  FOR SELECT
  USING (get_current_user_type() = 'master_admin');

CREATE POLICY "profile_select_store_owner_driver"
  ON public.profiles
  FOR SELECT
  USING (is_store_owner_of_driver(id));

-- INSERT
CREATE POLICY "profile_insert_self"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE
CREATE POLICY "profile_update_self"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_update_master_admin"
  ON public.profiles
  FOR UPDATE
  USING (get_current_user_type() = 'master_admin')
  WITH CHECK (get_current_user_type() = 'master_admin');

-- 2) USER_ROLES: permitir leitura do próprio usuário (necessário para carregar userRole)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON public.user_roles;

CREATE POLICY "user_roles_select_self_or_admin"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'master_admin'));
