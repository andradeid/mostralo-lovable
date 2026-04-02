
-- Função que retorna store_ids sem módulo whatsapp_chat ativo
-- Hierarquia: store_modules (override) → plan_modules (plano) → modules (global)
CREATE OR REPLACE FUNCTION public.get_stores_without_chat_module()
RETURNS TABLE(store_id uuid, store_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH chat_module AS (
    SELECT id FROM modules WHERE key = 'whatsapp_chat' AND is_active = true LIMIT 1
  ),
  stores_with_module AS (
    -- Lojas com override ATIVO em store_modules
    SELECT sm.store_id
    FROM store_modules sm
    JOIN chat_module cm ON sm.module_id = cm.id
    WHERE sm.is_enabled = true
  ),
  stores_with_override_disabled AS (
    -- Lojas com override DESATIVADO em store_modules
    SELECT sm.store_id
    FROM store_modules sm
    JOIN chat_module cm ON sm.module_id = cm.id
    WHERE sm.is_enabled = false
  ),
  stores_via_plan AS (
    -- Lojas cujo plano inclui o módulo (sem override)
    SELECT s.id AS store_id
    FROM stores s
    JOIN plan_modules pm ON s.plan_id = pm.plan_id
    JOIN chat_module cm ON pm.module_id = cm.id
    WHERE s.id NOT IN (SELECT store_id FROM store_modules sm2 JOIN chat_module cm2 ON sm2.module_id = cm2.id)
  )
  SELECT s.id AS store_id, s.name AS store_name
  FROM stores s
  WHERE s.id NOT IN (
    SELECT store_id FROM stores_with_module
    UNION
    SELECT store_id FROM stores_via_plan
  )
  -- Incluir lojas com override desativado
  OR s.id IN (SELECT store_id FROM stores_with_override_disabled)
$$;

-- Função para contar dados órfãos por loja
CREATE OR REPLACE FUNCTION public.count_orphan_whatsapp_data(p_store_id uuid)
RETURNS TABLE(messages_count bigint, conversations_count bigint, cycles_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM whatsapp_chat_messages WHERE store_id = p_store_id),
    (SELECT count(*) FROM whatsapp_conversations WHERE store_id = p_store_id),
    (SELECT count(*) FROM whatsapp_conversation_cycles WHERE store_id = p_store_id);
$$;

-- Função para deletar dados órfãos de uma loja em batch
CREATE OR REPLACE FUNCTION public.cleanup_orphan_whatsapp_data(p_store_id uuid, p_batch_size int DEFAULT 1000)
RETURNS TABLE(deleted_cycles bigint, deleted_messages bigint, deleted_conversations bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_cycles bigint := 0;
  v_deleted_messages bigint := 0;
  v_deleted_conversations bigint := 0;
  v_batch bigint;
BEGIN
  -- 1. Deletar cycles (dependem de conversations)
  LOOP
    DELETE FROM whatsapp_conversation_cycles
    WHERE id IN (
      SELECT id FROM whatsapp_conversation_cycles
      WHERE store_id = p_store_id
      LIMIT p_batch_size
    );
    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted_cycles := v_deleted_cycles + v_batch;
    EXIT WHEN v_batch < p_batch_size;
  END LOOP;

  -- 2. Deletar messages
  LOOP
    DELETE FROM whatsapp_chat_messages
    WHERE id IN (
      SELECT id FROM whatsapp_chat_messages
      WHERE store_id = p_store_id
      LIMIT p_batch_size
    );
    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted_messages := v_deleted_messages + v_batch;
    EXIT WHEN v_batch < p_batch_size;
  END LOOP;

  -- 3. Deletar conversations
  LOOP
    DELETE FROM whatsapp_conversations
    WHERE id IN (
      SELECT id FROM whatsapp_conversations
      WHERE store_id = p_store_id
      LIMIT p_batch_size
    );
    GET DIAGNOSTICS v_batch = ROW_COUNT;
    v_deleted_conversations := v_deleted_conversations + v_batch;
    EXIT WHEN v_batch < p_batch_size;
  END LOOP;

  RETURN QUERY SELECT v_deleted_cycles, v_deleted_messages, v_deleted_conversations;
END;
$$;
