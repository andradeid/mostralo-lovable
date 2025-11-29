-- PARTE 1: Criar índices faltantes para otimizar JOINs nas RLS policies
-- Resolve timeouts nas queries de product_variants

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- PARTE 2: Otimizar policy de products para não chamar função quando auth.uid() é NULL
-- Remove overhead desnecessário para usuários anônimos

DROP POLICY IF EXISTS "Attendants can view their store products" ON products;

CREATE POLICY "Attendants can view their store products" ON products
FOR SELECT TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND is_attendant_for_customer_store(store_id)
);

-- PARTE 3: Adicionar policy explícita para acesso público a products (sem funções pesadas)
-- Permite que usuários anônimos vejam produtos ativos sem executar funções

CREATE POLICY "Public can view available products of active stores" ON products
FOR SELECT TO anon, authenticated
USING (
  is_available = true 
  AND EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND stores.status = 'active'
  )
);

-- PARTE 4: Simplificar policy de product_variants para melhor performance
-- A policy anterior fazia JOIN em cascata muito pesado

DROP POLICY IF EXISTS "Public can view product variants of active stores" ON product_variants;

CREATE POLICY "Public can view product variants of active stores" ON product_variants
FOR SELECT TO anon, authenticated
USING (
  is_available = true
  AND EXISTS (
    SELECT 1 
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id
      AND p.is_available = true
      AND s.status = 'active'
  )
);