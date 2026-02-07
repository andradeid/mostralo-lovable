
-- Função para contar produtos com estoque baixo (server-side, sem limite de 1000 linhas)
CREATE OR REPLACE FUNCTION public.count_low_stock_products(p_store_id uuid)
RETURNS TABLE(low_stock_count bigint, out_of_stock_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE stock_quantity <= stock_alert_threshold) AS low_stock_count,
    COUNT(*) FILTER (WHERE stock_quantity = 0) AS out_of_stock_count
  FROM products
  WHERE store_id = p_store_id
    AND track_stock = true
    AND stock_quantity IS NOT NULL
    AND stock_alert_threshold IS NOT NULL;
$$;
