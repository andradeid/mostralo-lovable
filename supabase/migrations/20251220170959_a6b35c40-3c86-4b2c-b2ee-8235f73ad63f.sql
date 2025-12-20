-- CORREÇÃO COMPLETA: Mapeamento de event_type + Constraint de status

-- 1. Corrigir a constraint para incluir 'skipped'
ALTER TABLE whatsapp_message_queue 
  DROP CONSTRAINT IF EXISTS whatsapp_message_queue_status_check;

ALTER TABLE whatsapp_message_queue 
  ADD CONSTRAINT whatsapp_message_queue_status_check 
    CHECK (status = ANY (ARRAY['pending', 'processing', 'sent', 'skipped', 'failed']));

-- 2. Limpar mensagens pendentes antigas com event_type incorreto
DELETE FROM whatsapp_message_queue 
WHERE status = 'pending' 
  AND event_type IN ('order_ready_pickup', 'order_out_for_delivery', 'order_delivered', 'order_preparing');

-- 3. Corrigir o trigger com mapeamento CORRETO para a edge function
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_phone TEXT;
  v_customer_name TEXT;
  v_event_type TEXT;
  v_queue_id UUID;
BEGIN
  -- Só processa se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Buscar dados do cliente
    SELECT phone, name INTO v_customer_phone, v_customer_name
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Só continua se tiver telefone
    IF v_customer_phone IS NOT NULL AND v_customer_phone != '' THEN
      
      -- Mapear status para event_type COMPATÍVEL com a edge function
      -- Edge function espera: order_confirmed, order_ready, order_in_transit, order_completed, order_cancelled
      v_event_type := CASE NEW.status::text
        WHEN 'entrada' THEN 'order_confirmed'
        WHEN 'aguarda_retirada' THEN 'order_ready'
        WHEN 'em_transito' THEN 'order_in_transit'
        WHEN 'concluido' THEN 'order_completed'
        WHEN 'cancelado' THEN 'order_cancelled'
        ELSE NULL  -- em_preparo não tem evento correspondente
      END;
      
      -- Só insere na fila se tiver um event_type válido
      IF v_event_type IS NOT NULL THEN
        -- Inserir na fila
        INSERT INTO whatsapp_message_queue (
          store_id,
          order_id,
          event_type,
          phone_number,
          customer_name,
          status,
          attempts
        ) VALUES (
          NEW.store_id,
          NEW.id,
          v_event_type,
          v_customer_phone,
          COALESCE(v_customer_name, 'Cliente'),
          'pending',
          0
        )
        RETURNING id INTO v_queue_id;
        
        -- Log da inserção
        RAISE LOG 'WhatsApp queue: Inserted message % for order % with event %', v_queue_id, NEW.id, v_event_type;
        
        -- Chamar whatsapp-process-queue via pg_net para processar imediatamente
        PERFORM net.http_post(
          url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/whatsapp-process-queue',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
          ),
          body := jsonb_build_object('triggered_by', 'order_status_trigger', 'queue_id', v_queue_id)
        );
        
        RAISE LOG 'WhatsApp queue: Triggered immediate processing for queue %', v_queue_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;