-- Índice para busca textual rápida com ilike no nome dos produtos
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON public.products USING gin (name gin_trgm_ops);

-- Índice composto para ordenação por store_id + display_order (query principal)
CREATE INDEX IF NOT EXISTS idx_products_store_display_order 
ON public.products USING btree (store_id, display_order);

-- Índice composto para store_id + category_id (agrupamento por categoria)
CREATE INDEX IF NOT EXISTS idx_products_store_category 
ON public.products USING btree (store_id, category_id);