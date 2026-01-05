-- Tabela para logs do Sentinela (execuções manuais e automáticas)
CREATE TABLE IF NOT EXISTS public.sentinela_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'check' ou 'send'
  result JSONB,
  triggered_by TEXT NOT NULL DEFAULT 'cron', -- 'cron' ou 'manual'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sentinela_logs ENABLE ROW LEVEL SECURITY;

-- Policy para loja ver seus próprios logs
CREATE POLICY "Stores can view their own sentinela logs"
  ON public.sentinela_logs
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Policy para service role inserir
CREATE POLICY "Service role can insert sentinela logs"
  ON public.sentinela_logs
  FOR INSERT
  WITH CHECK (true);

-- Index para performance
CREATE INDEX idx_sentinela_logs_store_id ON public.sentinela_logs(store_id);
CREATE INDEX idx_sentinela_logs_created_at ON public.sentinela_logs(created_at DESC);

-- Trigger para rastrear conversões automaticamente quando um cliente faz pedido
CREATE OR REPLACE FUNCTION public.track_sentinela_conversion()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  product_id_to_check UUID;
BEGIN
  -- Só processar pedidos concluídos/entregues
  IF NEW.status NOT IN ('concluido', 'entregue') THEN
    RETURN NEW;
  END IF;
  
  -- Se não tem customer_id, ignorar
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Iterar sobre os itens do pedido
  IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
    FOR item_record IN SELECT * FROM jsonb_array_elements(NEW.items) AS item
    LOOP
      product_id_to_check := (item_record.item->>'product_id')::UUID;
      
      -- Verificar se existe lembrete enviado para este cliente+produto
      -- que foi enviado nos últimos 7 dias e ainda não foi convertido
      UPDATE sentinela_reminders
      SET 
        status = 'converted',
        converted_at = now(),
        converted_order_id = NEW.id
      WHERE 
        customer_id = NEW.customer_id
        AND product_id = product_id_to_check
        AND status = 'sent'
        AND sent_at >= (now() - interval '7 days')
        AND converted_at IS NULL;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_track_sentinela_conversion ON public.orders;
CREATE TRIGGER trigger_track_sentinela_conversion
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_sentinela_conversion();

-- Adicionar colunas de conversão se não existirem
DO $$
BEGIN
  -- Adicionar converted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sentinela_reminders' AND column_name = 'converted_at'
  ) THEN
    ALTER TABLE public.sentinela_reminders ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Adicionar converted_order_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sentinela_reminders' AND column_name = 'converted_order_id'
  ) THEN
    ALTER TABLE public.sentinela_reminders ADD COLUMN converted_order_id UUID REFERENCES public.orders(id);
  END IF;
END $$;