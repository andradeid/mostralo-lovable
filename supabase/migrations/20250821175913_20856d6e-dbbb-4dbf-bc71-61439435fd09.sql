-- Corrigir o problema de Security Definer na view

-- 1. Remover a view problemática
DROP VIEW IF EXISTS public.public_stores;

-- 2. Criar uma view simples sem SECURITY DEFINER
CREATE VIEW public.public_stores AS 
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

-- 3. Garantir que a view tenha as permissões corretas
GRANT SELECT ON public.public_stores TO anon, authenticated;