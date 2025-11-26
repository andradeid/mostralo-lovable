-- Corrigir vulnerabilidade de segurança: remover acesso público a informações sensíveis das lojas

-- 1. Primeiro, remover a política que permite acesso público total
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;

-- 2. Criar uma política mais restritiva que permite acesso público apenas a informações básicas
-- Como o RLS funciona no nível de linha, não de coluna, vamos usar uma abordagem diferente

-- 3. Criar uma view pública que expõe apenas informações não-sensíveis
CREATE OR REPLACE VIEW public.public_stores AS 
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  cover_url,
  theme_colors,
  status,
  created_at
FROM public.stores 
WHERE status = 'active';

-- 4. Permitir acesso público apenas à view
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- 5. Criar política mais restritiva para a tabela stores original
CREATE POLICY "Store owners and admins can view stores" ON public.stores
FOR SELECT USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'master_admin'
  )
);

-- 6. Manter as políticas de gerenciamento existentes (já são seguras)
-- As políticas "Master admins can manage all stores" e "Store owners can manage their stores" já estão corretas