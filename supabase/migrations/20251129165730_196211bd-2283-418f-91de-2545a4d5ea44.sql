-- Índices para melhorar performance de queries em product_variants
-- Resolve erro 500 (timeout) nas queries com product_id

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_is_available 
ON product_variants(product_id, is_available);

-- Comentário: Estes índices aceleram queries filtradas por product_id 
-- (usado em variantes de produtos) e is_available (usado em RLS policies)