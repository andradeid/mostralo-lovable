-- Remover a policy problemática que causa recursão infinita
DROP POLICY IF EXISTS "Blocked users cannot access" ON profiles;

-- Criar função security definer para verificar se usuário está bloqueado
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND (is_blocked = false OR is_blocked IS NULL)
      AND (is_deleted = false OR is_deleted IS NULL)
  )
$$;

-- Recriar a policy usando a função security definer
CREATE POLICY "Active users and master admins can access profiles"
ON profiles FOR ALL
USING (
  public.is_user_active(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);