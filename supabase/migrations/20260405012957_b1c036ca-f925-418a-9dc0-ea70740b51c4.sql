
-- =====================================================
-- SECURITY DEFINER para whatsapp_chat_messages
-- Benefício: cache do plano de execução, bypass RLS otimizado
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_whatsapp_messages_for_store(
  p_store_id UUID,
  p_remote_jid TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS SETOF public.whatsapp_chat_messages
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que o usuário autenticado é admin/atendente da loja
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
      AND role IN ('store_admin', 'attendant')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é admin desta loja';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.whatsapp_chat_messages
  WHERE store_id = p_store_id
    AND remote_jid = p_remote_jid
  ORDER BY timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- SECURITY DEFINER para comanda_items
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_comanda_items_for_store(
  p_store_id UUID,
  p_comanda_id UUID DEFAULT NULL
)
RETURNS SETOF public.comanda_items
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que o usuário autenticado é admin/atendente da loja
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
      AND role IN ('store_admin', 'attendant')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é admin desta loja';
  END IF;

  IF p_comanda_id IS NOT NULL THEN
    RETURN QUERY
    SELECT *
    FROM public.comanda_items
    WHERE store_id = p_store_id
      AND comanda_id = p_comanda_id
    ORDER BY added_at DESC;
  ELSE
    RETURN QUERY
    SELECT *
    FROM public.comanda_items
    WHERE store_id = p_store_id
    ORDER BY added_at DESC;
  END IF;
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_whatsapp_messages_for_store TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_comanda_items_for_store TO authenticated;
