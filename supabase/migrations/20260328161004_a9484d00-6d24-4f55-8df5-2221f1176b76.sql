CREATE OR REPLACE FUNCTION public.trigger_whatsapp_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_customer_phone TEXT;
  v_customer_name TEXT;
  v_event_type TEXT;
  v_queue_id UUID;
  v_existing_count INTEGER;
BEGIN
  SELECT phone, name INTO v_customer_phone, v_customer_name
  FROM customers
  WHERE id = NEW.customer_id;
  
  IF v_customer_phone IS NULL OR v_customer_phone = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('entrada', 'aguardando_pagamento') THEN
      v_event_type := 'order_received';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
      RETURN NEW;
    END IF;
    
    v_event_type := CASE NEW.status::text
      WHEN 'entrada' THEN 'order_confirmed'
      WHEN 'em_preparo' THEN 'order_confirmed'
      WHEN 'aguarda_retirada' THEN 'order_ready'
      WHEN 'em_transito' THEN 'order_in_transit'
      WHEN 'concluido' THEN 'order_completed'
      WHEN 'cancelado' THEN 'order_cancelled'
      ELSE NULL
    END;
  END IF;
  
  IF v_event_type IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT COUNT(*) INTO v_existing_count
  FROM whatsapp_message_queue
  WHERE order_id = NEW.id
    AND event_type = v_event_type
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_existing_count > 0 THEN
    RAISE LOG 'WhatsApp queue: SKIPPED duplicate for order %, event %', NEW.id, v_event_type;
    RETURN NEW;
  END IF;
  
  BEGIN
    INSERT INTO whatsapp_message_queue (
      store_id, order_id, event_type, phone_number, customer_name, status, attempts
    ) VALUES (
      NEW.store_id, NEW.id, v_event_type, v_customer_phone,
      COALESCE(v_customer_name, 'Cliente'), 'pending', 0
    )
    RETURNING id INTO v_queue_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'WhatsApp queue: duplicate prevented by unique index for order %, event %', NEW.id, v_event_type;
      RETURN NEW;
  END;
  
  BEGIN
    PERFORM net.http_post(
      url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/whatsapp-process-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object('triggered_by', 'order_status_trigger', 'queue_id', v_queue_id)
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp queue: failed to trigger processor for queue %: %', v_queue_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;