-- Ajustar a view pública para incluir informações de contato (que são legitimamente públicas)
-- mas manter privadas as informações sensíveis de negócio

DROP VIEW IF EXISTS public.public_stores;

CREATE VIEW public.public_stores AS 
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  cover_url,
  phone,
  address,
  theme_colors,
  status,
  created_at
FROM public.stores 
WHERE status = 'active';

-- Garantir permissões corretas
GRANT SELECT ON public.public_stores TO anon, authenticated;