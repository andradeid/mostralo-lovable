-- CORREÇÃO URGENTE: Remover políticas que causam recursão infinita

-- 1. Dropar políticas problemáticas de profiles
DROP POLICY IF EXISTS "Store owners can view their delivery drivers profiles" ON profiles;

-- 2. Dropar políticas problemáticas de user_roles
DROP POLICY IF EXISTS "Master admins can view all roles (profiles based)" ON user_roles;
DROP POLICY IF EXISTS "Store owners can view delivery driver roles" ON user_roles;

-- 3. Criar função SECURITY DEFINER para verificar se usuário é dono da loja do entregador
CREATE OR REPLACE FUNCTION public.is_store_owner_of_driver(driver_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN stores s ON s.id = ur.store_id
    WHERE ur.user_id = driver_user_id
      AND ur.role = 'delivery_driver'
      AND s.owner_id = auth.uid()
  );
$$;

-- 4. Recriar política em profiles usando a função SECURITY DEFINER (SEM RECURSÃO)
CREATE POLICY "Store owners can view their delivery drivers profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  public.is_store_owner_of_driver(profiles.id)
);

-- 5. Recriar política simplificada em user_roles (SEM RECURSÃO)
CREATE POLICY "Store owners can view delivery driver roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  role = 'delivery_driver' AND 
  public.is_store_owner_of_driver(user_id)
);