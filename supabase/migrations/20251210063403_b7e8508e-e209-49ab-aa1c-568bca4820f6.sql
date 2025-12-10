-- Adicionar coluna test_phone_number na tabela whatsapp_auto_messages
ALTER TABLE whatsapp_auto_messages 
ADD COLUMN IF NOT EXISTS test_phone_number TEXT;

-- Criar tabela de fila de mensagens para processamento assíncrono
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_status ON whatsapp_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_store_id ON whatsapp_message_queue(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_queue_created_at ON whatsapp_message_queue(created_at);

-- Enable RLS
ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Store owners can view their message queue"
ON whatsapp_message_queue FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores 
  WHERE stores.id = whatsapp_message_queue.store_id 
  AND stores.owner_id = auth.uid()
));

CREATE POLICY "System can manage message queue"
ON whatsapp_message_queue FOR ALL
USING (true)
WITH CHECK (true);

-- Função que dispara mensagem automática quando status do pedido muda
CREATE OR REPLACE FUNCTION trigger_whatsapp_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  -- Só dispara se o status realmente mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Mapear status para tipo de evento
  v_event_type := CASE NEW.status::text
    WHEN 'entrada' THEN 'order_received'
    WHEN 'em_preparo' THEN 'order_confirmed'
    WHEN 'aguarda_retirada' THEN 'order_ready'
    WHEN 'em_transito' THEN 'order_in_transit'
    WHEN 'concluido' THEN 'order_completed'
    WHEN 'cancelado' THEN 'order_cancelled'
    ELSE NULL
  END;
  
  -- Inserir na fila se tiver evento mapeado
  IF v_event_type IS NOT NULL THEN
    INSERT INTO whatsapp_message_queue (
      store_id, 
      order_id, 
      event_type, 
      phone_number,
      customer_name,
      created_at
    ) VALUES (
      NEW.store_id,
      NEW.id,
      v_event_type,
      NEW.customer_phone,
      NEW.customer_name,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger que executa após UPDATE de status
DROP TRIGGER IF EXISTS order_status_whatsapp_trigger ON orders;
CREATE TRIGGER order_status_whatsapp_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_whatsapp_order_status();

-- Habilitar realtime para a fila
ALTER TABLE whatsapp_message_queue REPLICA IDENTITY FULL;