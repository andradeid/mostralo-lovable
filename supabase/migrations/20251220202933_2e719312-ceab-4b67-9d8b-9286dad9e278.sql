CREATE OR REPLACE FUNCTION public.notify_store_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  store_record RECORD;
  customer_record RECORD;
  payload JSONB;
  supabase_url TEXT;
BEGIN
  -- Buscar dados da loja (CORRIGIDO: usar status = 'connected' ao invés de is_active)
  SELECT 
    s.id,
    s.name,
    s.notification_phone,
    s.notification_country_code,
    s.notification_phone_2,
    s.notification_country_code_2,
    s.new_order_message_template,
    s.notify_new_orders,
    s.whatsapp,
    s.phone,
    wi.phone_number as instance_phone,
    wi.instance_name,
    wi.status as instance_status
  INTO store_record
  FROM stores s
  LEFT JOIN whatsapp_instances wi ON wi.store_id = s.id AND wi.status = 'connected'
  WHERE s.id = NEW.store_id;

  -- Verificar se notificações estão ativas
  IF store_record.notify_new_orders IS FALSE THEN
    RETURN NEW;
  END IF;

  -- Determinar número de destino
  IF store_record.notification_phone IS NULL 
     AND store_record.notification_phone_2 IS NULL
     AND store_record.instance_phone IS NULL 
     AND store_record.whatsapp IS NULL 
     AND store_record.phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do cliente incluindo coordenadas
  SELECT name, phone, address, latitude, longitude
  INTO customer_record
  FROM customers
  WHERE id = NEW.customer_id;

  -- Montar payload
  payload := jsonb_build_object(
    'store_id', NEW.store_id,
    'order_id', NEW.id,
    'store_name', store_record.name,
    'notification_phone', store_record.notification_phone,
    'notification_country_code', COALESCE(store_record.notification_country_code, '+55'),
    'notification_phone_2', store_record.notification_phone_2,
    'notification_country_code_2', COALESCE(store_record.notification_country_code_2, '+55'),
    'new_order_message_template', store_record.new_order_message_template,
    'instance_phone', store_record.instance_phone,
    'instance_name', store_record.instance_name,
    'instance_status', store_record.instance_status,
    'store_whatsapp', store_record.whatsapp,
    'store_phone', store_record.phone,
    'order_number', NEW.order_number,
    'customer_name', customer_record.name,
    'customer_phone', customer_record.phone,
    'customer_address', customer_record.address,
    'customer_latitude', customer_record.latitude,
    'customer_longitude', customer_record.longitude,
    'delivery_address', NEW.delivery_address,
    'total', NEW.total,
    'subtotal', NEW.subtotal,
    'delivery_fee', NEW.delivery_fee,
    'delivery_type', NEW.delivery_type,
    'payment_method', NEW.payment_method,
    'notes', NEW.notes,
    'created_at', NEW.created_at
  );

  -- Chamar edge function via pg_net
  supabase_url := 'https://noshwvwpjtnvndokbfjx.supabase.co';
  
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-store-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA'
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao notificar loja sobre novo pedido: %', SQLERRM;
    RETURN NEW;
END;
$$;