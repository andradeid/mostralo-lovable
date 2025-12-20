-- 1. Dropar o trigger existente para recriar com INSERT OR UPDATE
DROP TRIGGER IF EXISTS order_status_whatsapp_trigger ON orders;

-- 2. Atualizar a função do trigger para suportar INSERT e UPDATE
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
  -- Buscar dados do cliente
  SELECT phone, name INTO v_customer_phone, v_customer_name
  FROM customers
  WHERE id = NEW.customer_id;
  
  -- Só continua se tiver telefone
  IF v_customer_phone IS NULL OR v_customer_phone = '' THEN
    RETURN NEW;
  END IF;

  -- === LÓGICA PARA INSERT (novo pedido) ===
  IF TG_OP = 'INSERT' THEN
    -- Para novos pedidos com status inicial, enviar order_received
    IF NEW.status IN ('entrada', 'aguardando_pagamento', 'pendente') THEN
      v_event_type := 'order_received';
    ELSE
      RETURN NEW; -- Não enviar para outros status iniciais
    END IF;
  
  -- === LÓGICA PARA UPDATE (mudança de status) ===
  ELSIF TG_OP = 'UPDATE' THEN
    -- Só processa se o status mudou
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
    
    -- Mapear status para event_type
    v_event_type := CASE NEW.status::text
      WHEN 'entrada' THEN 'order_confirmed'  -- Quando loja aceita o pedido
      WHEN 'em_preparo' THEN 'order_confirmed' -- Quando começa a preparar
      WHEN 'aguarda_retirada' THEN 'order_ready'
      WHEN 'em_transito' THEN 'order_in_transit'
      WHEN 'concluido' THEN 'order_completed'
      WHEN 'cancelado' THEN 'order_cancelled'
      ELSE NULL
    END;
  END IF;
  
  -- Só insere na fila se tiver um event_type válido
  IF v_event_type IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe mensagem para este pedido + evento nos últimos 5 minutos
  SELECT COUNT(*) INTO v_existing_count
  FROM whatsapp_message_queue
  WHERE order_id = NEW.id
    AND event_type = v_event_type
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Só insere se não houver duplicata recente
  IF v_existing_count > 0 THEN
    RAISE LOG 'WhatsApp queue: SKIPPED duplicate message for order % event % (found % recent)', NEW.id, v_event_type, v_existing_count;
    RETURN NEW;
  END IF;
  
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
  
  RAISE LOG 'WhatsApp queue: Inserted message % for order % with event % (TG_OP: %)', v_queue_id, NEW.id, v_event_type, TG_OP;
  
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
  
  RETURN NEW;
END;
$function$;

-- 3. Recriar o trigger para escutar INSERT E UPDATE
CREATE TRIGGER order_status_whatsapp_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_whatsapp_order_status();