-- CORREÇÃO URGENTE: Mapear status CORRETOS (português) para event_type
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
      
      -- Mapear status CORRETOS (português) para event_type
      v_event_type := CASE NEW.status::text
        WHEN 'entrada' THEN 'order_confirmed'
        WHEN 'em_preparo' THEN 'order_preparing'
        WHEN 'aguarda_retirada' THEN 'order_ready_pickup'
        WHEN 'em_transito' THEN 'order_out_for_delivery'
        WHEN 'concluido' THEN 'order_delivered'
        WHEN 'cancelado' THEN 'order_cancelled'
        ELSE NULL
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