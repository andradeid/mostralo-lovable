-- Adicionar campos de notificação WhatsApp na tabela stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS notification_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_country_code TEXT DEFAULT '+55',
ADD COLUMN IF NOT EXISTS notify_new_orders BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN public.stores.notification_phone IS 'Número de telefone para receber notificações de novos pedidos via WhatsApp';
COMMENT ON COLUMN public.stores.notification_country_code IS 'Código do país para o número de notificação (ex: +55)';
COMMENT ON COLUMN public.stores.notify_new_orders IS 'Se true, envia notificação WhatsApp quando um novo pedido é criado';

-- Criar função para notificar novo pedido para o lojista
CREATE OR REPLACE FUNCTION public.notify_store_new_order()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  store_record RECORD;
  customer_record RECORD;
  payload JSONB;
  supabase_url TEXT;
BEGIN
  -- Buscar dados da loja
  SELECT 
    s.id,
    s.name,
    s.notification_phone,
    s.notification_country_code,
    s.notify_new_orders,
    s.whatsapp,
    s.phone,
    wi.phone_number as instance_phone,
    wi.instance_name,
    wi.status as instance_status
  INTO store_record
  FROM stores s
  LEFT JOIN whatsapp_instances wi ON wi.store_id = s.id AND wi.is_active = true
  WHERE s.id = NEW.store_id;

  -- Verificar se notificações estão ativas
  IF store_record.notify_new_orders IS FALSE THEN
    RETURN NEW;
  END IF;

  -- Determinar número de destino (prioridade: notification_phone > instance_phone > whatsapp > phone)
  IF store_record.notification_phone IS NULL 
     AND store_record.instance_phone IS NULL 
     AND store_record.whatsapp IS NULL 
     AND store_record.phone IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar dados do cliente
  SELECT name, phone, address
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
    'instance_phone', store_record.instance_phone,
    'instance_name', store_record.instance_name,
    'instance_status', store_record.instance_status,
    'store_whatsapp', store_record.whatsapp,
    'store_phone', store_record.phone,
    'order_number', NEW.order_number,
    'customer_name', customer_record.name,
    'customer_phone', customer_record.phone,
    'customer_address', customer_record.address,
    'delivery_address', NEW.delivery_address,
    'total', NEW.total,
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
    -- Log erro mas não bloqueia a inserção do pedido
    RAISE WARNING 'Erro ao notificar loja sobre novo pedido: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger para novos pedidos
DROP TRIGGER IF EXISTS on_new_order_notify_store ON public.orders;
CREATE TRIGGER on_new_order_notify_store
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_store_new_order();