-- Função para verificar se o usuário é admin da loja do profissional
CREATE OR REPLACE FUNCTION public.is_store_admin_of_professional(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM professionals p
    JOIN stores s ON p.store_id = s.id
    WHERE p.user_id = profile_id
    AND s.owner_id = auth.uid()
  );
END;
$$;

-- Política RLS para permitir que admins de loja vejam profiles dos profissionais
CREATE POLICY "store_admin_can_view_professional_profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_store_admin_of_professional(id)
);