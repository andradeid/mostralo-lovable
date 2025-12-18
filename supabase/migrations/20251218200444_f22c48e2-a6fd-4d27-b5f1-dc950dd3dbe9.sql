-- Criar tabela para integrações iFood
CREATE TABLE public.ifood_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  merchant_id TEXT, -- ID da loja no iFood
  client_id TEXT, -- Credencial OAuth
  client_secret TEXT, -- Credencial OAuth (criptografada)
  access_token TEXT, -- Token atual
  refresh_token TEXT, -- Token de renovação
  token_expires_at TIMESTAMPTZ, -- Expiração do token
  is_active BOOLEAN DEFAULT false,
  webhook_secret TEXT, -- Para validar webhooks
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Criar tabela para log de eventos iFood
CREATE TABLE public.ifood_events_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- ID único do evento iFood
  event_type TEXT NOT NULL, -- Tipo do evento (PLACED, CONFIRMED, etc)
  event_code TEXT, -- Código do evento
  order_id TEXT, -- ID do pedido iFood
  payload JSONB, -- Dados completos do evento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Adicionar colunas na tabela orders para pedidos externos
DO $$ 
BEGIN
  -- Adicionar source se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') THEN
    ALTER TABLE public.orders ADD COLUMN source TEXT DEFAULT 'manual';
  END IF;
  
  -- Adicionar external_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'external_id') THEN
    ALTER TABLE public.orders ADD COLUMN external_id TEXT;
  END IF;
  
  -- Adicionar external_data se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'external_data') THEN
    ALTER TABLE public.orders ADD COLUMN external_data JSONB;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_ifood_integrations_store_id ON public.ifood_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_ifood_integrations_active ON public.ifood_integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ifood_events_log_store_id ON public.ifood_events_log(store_id);
CREATE INDEX IF NOT EXISTS idx_ifood_events_log_order_id ON public.ifood_events_log(order_id);
CREATE INDEX IF NOT EXISTS idx_ifood_events_log_processed ON public.ifood_events_log(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);

-- Enable RLS
ALTER TABLE public.ifood_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_events_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ifood_integrations
CREATE POLICY "Store owners can view their ifood integrations"
ON public.ifood_integrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_integrations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can insert their ifood integrations"
ON public.ifood_integrations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_integrations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can update their ifood integrations"
ON public.ifood_integrations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_integrations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can delete their ifood integrations"
ON public.ifood_integrations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_integrations.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Políticas RLS para ifood_events_log
CREATE POLICY "Store owners can view their ifood events"
ON public.ifood_events_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_events_log.store_id 
    AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "Store owners can insert ifood events"
ON public.ifood_events_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = ifood_events_log.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_ifood_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ifood_integrations_updated_at
BEFORE UPDATE ON public.ifood_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_ifood_integrations_updated_at();