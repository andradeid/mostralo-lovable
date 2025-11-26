-- Corrigir recursão infinita criando função security definer

-- Remover a política problemática
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.profiles;

-- Criar função security definer para evitar recursão
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS user_type AS $$
  SELECT user_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recriar política para master admin sem recursão
CREATE POLICY "Master admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_type() = 'master_admin');