-- Correção de Segurança Crítica: Credenciais de Pagamento Expostas e Security Definer View

-- ============================================================================
-- PROBLEMA 1: Credenciais de Pagamento Expostas Publicamente
-- ============================================================================
-- A tabela store_configurations expõe tokens de pagamento (Mercado Pago, Stripe, PIX)
-- para usuários não autenticados através de uma política pública muito permissiva.

-- Passo 1: Remover a política pública perigosa
DROP POLICY IF EXISTS "Public can view store configurations of active stores" ON public.store_configurations;

-- Passo 2: Criar política restrita apenas para donos de loja e admins
CREATE POLICY "Store owners and admins can view their configurations"
ON public.store_configurations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_configurations.store_id
    AND (
      stores.owner_id = auth.uid() OR
      has_role(auth.uid(), 'master_admin')
    )
  )
);

-- Passo 3: Criar view pública com apenas dados não-sensíveis para clientes
CREATE OR REPLACE VIEW public.public_store_config AS
SELECT
  store_id,
  primary_color,
  secondary_color,
  product_display_layout,
  delivery_button_text,
  pickup_button_text,
  qr_code_enabled,
  delivery_times,
  delivery_zones,
  created_at,
  updated_at
FROM public.store_configurations
WHERE EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_configurations.store_id
  AND stores.status = 'active'
);

-- Garantir acesso público à view segura
GRANT SELECT ON public.public_store_config TO anon, authenticated;

-- ============================================================================
-- PROBLEMA 2: Security Definer View (public_stores)
-- ============================================================================
-- Garantir que a view public_stores não tenha SECURITY DEFINER

-- Recriar a view sem SECURITY DEFINER (se já existir, será substituída)
CREATE OR REPLACE VIEW public.public_stores AS
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
FROM public.stores
WHERE status = 'active';

-- Garantir acesso público à view
GRANT SELECT ON public.public_stores TO anon, authenticated;