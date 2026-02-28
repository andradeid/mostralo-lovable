-- Habilitar extensão pg_trgm se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Criar função RPC para busca fuzzy de produtos
CREATE OR REPLACE FUNCTION public.fuzzy_search_products(
  p_store_id UUID,
  p_search_term TEXT,
  p_limit INT DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.15
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  original_price NUMERIC,
  offer_price NUMERIC,
  description TEXT,
  is_available BOOLEAN,
  is_featured BOOLEAN,
  is_on_offer BOOLEAN,
  track_stock BOOLEAN,
  stock_quantity INT,
  image_url TEXT,
  category_name TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.price,
    p.original_price,
    p.offer_price,
    p.description,
    p.is_available,
    p.is_featured,
    p.is_on_offer,
    p.track_stock,
    p.stock_quantity::INT,
    p.image_url,
    c.name AS category_name,
    similarity(LOWER(p.name), LOWER(p_search_term))::FLOAT AS similarity_score
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.store_id = p_store_id
    AND p.is_available = true
    AND similarity(LOWER(p.name), LOWER(p_search_term)) >= p_min_similarity
  ORDER BY similarity_score DESC, p.is_featured DESC
  LIMIT p_limit;
END;
$$;