-- 1. Adicionar políticas RLS para profiles (permitir usuário ler próprio perfil)
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Adicionar políticas RLS para user_roles (permitir usuário ler próprias roles)
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Backfill de profiles para usuários existentes sem registro
INSERT INTO public.profiles (id, email, full_name, user_type, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Usuário'),
  CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'master_admin') THEN 'master_admin'::public.user_type
    WHEN EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'store_admin') THEN 'store_admin'::public.user_type
    ELSE 'store_admin'::public.user_type
  END,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;