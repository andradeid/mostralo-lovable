-- Atualizar view public_stores para filtrar lojas com assinatura expirada
-- Isso garante que lojas com assinatura expirada não apareçam para clientes

DROP VIEW IF EXISTS public_stores;

CREATE VIEW public_stores AS
SELECT 
  id, 
  name, 
  slug, 
  description, 
  logo_url, 
  cover_url, 
  phone, 
  address, 
  city, 
  state, 
  business_hours, 
  theme_colors, 
  status, 
  created_at
FROM stores
WHERE status = 'active'
  AND (
    subscription_expires_at IS NULL  -- Sem data de expiração = não expira
    OR subscription_expires_at > NOW()  -- Assinatura ainda válida
  );

-- Garantir permissões de leitura pública
GRANT SELECT ON public_stores TO anon, authenticated;