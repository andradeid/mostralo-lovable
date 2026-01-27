-- Adiciona coluna is_featured à tabela products para sistema de destaques
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Índice para otimizar buscas de produtos em destaque
CREATE INDEX IF NOT EXISTS idx_products_is_featured 
ON public.products(is_featured) WHERE is_featured = true;

-- Índice composto para buscar destaques por loja
CREATE INDEX IF NOT EXISTS idx_products_store_featured 
ON public.products(store_id, is_featured) WHERE is_featured = true;