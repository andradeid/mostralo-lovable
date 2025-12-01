-- ========================================
-- OTIMIZAÇÃO: RLS Policy product_variants
-- ========================================
-- Objetivo: Corrigir timeout na tela da loja causado por query complexa

-- PASSO 1: Criar função SECURITY DEFINER eficiente
CREATE OR REPLACE FUNCTION public.is_product_variant_from_active_store(variant_product_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.id = variant_product_id 
      AND p.is_available = true
      AND s.status = 'active'
  )
$$;

-- PASSO 2: Remover policy antiga complexa
DROP POLICY IF EXISTS "Public can view product variants of active stores" ON product_variants;

-- PASSO 3: Criar nova policy otimizada usando a função
CREATE POLICY "Public can view product variants of active stores v2" 
ON product_variants FOR SELECT
TO anon, authenticated
USING (
  is_available = true 
  AND is_product_variant_from_active_store(product_id)
);

-- PASSO 4: Criar índices para máxima performance
CREATE INDEX IF NOT EXISTS idx_products_store_available 
ON products(store_id, is_available) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_available 
ON product_variants(product_id, is_available) 
WHERE is_available = true;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Query de product_variants executa em <100ms
-- ✅ Tela da loja do João carrega normalmente
-- ✅ Cliente vê os produtos sem erro
-- ✅ Zero impacto nas outras funcionalidades