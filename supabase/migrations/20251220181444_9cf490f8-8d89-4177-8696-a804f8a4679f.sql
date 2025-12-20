-- 1. Criar índice para performance nas consultas de duplicação
CREATE INDEX IF NOT EXISTS idx_queue_order_event_time 
ON whatsapp_message_queue (order_id, event_type, created_at DESC);

-- 2. Criar constraint única para impedir múltiplas mensagens pendentes do mesmo tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_message
ON whatsapp_message_queue (order_id, event_type)
WHERE status = 'pending';

-- 3. Atualizar o trigger para verificar duplicatas antes de inserir
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_phone TEXT;
  v_customer_name TEXT;
  v_event_type TEXT;
  v_queue_id UUID;
  v_existing_count INTEGER;
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
      v_event_type := CASE NEW.status::text
        WHEN 'entrada' THEN 'order_confirmed'
        WHEN 'aguarda_retirada' THEN 'order_ready'
        WHEN 'em_transito' THEN 'order_in_transit'
        WHEN 'concluido' THEN 'order_completed'
        WHEN 'cancelado' THEN 'order_cancelled'
        ELSE NULL
      END;
      
      -- Só insere na fila se tiver um event_type válido
      IF v_event_type IS NOT NULL THEN
        
        -- NOVO: Verificar se já existe mensagem para este pedido + evento nos últimos 5 minutos
        SELECT COUNT(*) INTO v_existing_count
        FROM whatsapp_message_queue
        WHERE order_id = NEW.id
          AND event_type = v_event_type
          AND created_at > NOW() - INTERVAL '5 minutes';
        
        -- Só insere se não houver duplicata recente
        IF v_existing_count = 0 THEN
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
        ELSE
          -- Log que foi ignorado por duplicação
          RAISE LOG 'WhatsApp queue: SKIPPED duplicate message for order % event % (found % recent)', NEW.id, v_event_type, v_existing_count;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;