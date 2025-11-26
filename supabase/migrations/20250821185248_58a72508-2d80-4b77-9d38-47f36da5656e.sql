-- Corrigir função para incluir search_path e evitar warning de segurança
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS user_type 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE id = auth.uid();
$$;