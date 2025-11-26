-- 1) Garantir RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) Remover todas as políticas existentes de profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- 3) Remover todas as políticas existentes de user_roles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', r.policyname);
  END LOOP;
END $$;

-- 4) Recriar políticas seguras em profiles (sem recursão)
CREATE POLICY profiles_select_self_or_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR public.has_role(auth.uid(), 'master_admin')
);

CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_admin
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- 5) Recriar política segura em user_roles
CREATE POLICY user_roles_select_self
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 6) Criar trigger para perfis automáticos (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- 7) Backfill de perfis ausentes
INSERT INTO public.profiles (id, email, full_name, user_type)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE WHEN u.email = 'admin@mostralo.com' THEN 'master_admin' ELSE 'store_admin' END::user_type
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;