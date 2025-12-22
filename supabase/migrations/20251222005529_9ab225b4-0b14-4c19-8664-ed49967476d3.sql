-- Criar função de limpeza automática (roda a cada consulta se necessário)
CREATE OR REPLACE FUNCTION public.cleanup_old_password_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_calls
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Criar função wrapper que limpa e retorna dados
CREATE OR REPLACE FUNCTION public.get_password_calls_with_cleanup(p_store_id uuid, p_limit int DEFAULT 10)
RETURNS SETOF public.password_calls
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar registros antigos primeiro
  PERFORM public.cleanup_old_password_calls();
  
  -- Retornar chamadas recentes
  RETURN QUERY
  SELECT * FROM public.password_calls
  WHERE store_id = p_store_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;