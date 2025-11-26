-- Remove a política pública perigosa que expõe dados sensíveis
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;

-- Cria uma política mais segura que permite apenas visualização de dados não sensíveis via view
-- Os dados completos (incluindo informações pessoais) só são acessíveis:
-- 1. Pelo proprietário da loja (owner_id = auth.uid())
-- 2. Pelos master admins
-- 3. Via a view public_stores que expõe apenas dados não sensíveis

-- Adiciona comentário na tabela stores alertando sobre dados sensíveis
COMMENT ON TABLE public.stores IS 'Contém dados sensíveis do proprietário. Use a view public_stores para acesso público.';

-- Garante que a view public_stores está acessível publicamente
GRANT SELECT ON public.public_stores TO anon;
GRANT SELECT ON public.public_stores TO authenticated;