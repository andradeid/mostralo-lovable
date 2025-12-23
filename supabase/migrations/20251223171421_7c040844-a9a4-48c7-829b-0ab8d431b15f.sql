-- Tabela para armazenar logs de todos os webhooks recebidos
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL, -- 'pix', 'boleto', 'whatsapp', 'ifood', 'account'
  source TEXT NOT NULL, -- 'efi-pix-webhook', 'efi-boleto-webhook', etc.
  event_type TEXT, -- 'payment_received', 'payment_confirmed', etc.
  payload JSONB, -- Payload original recebido
  status TEXT NOT NULL DEFAULT 'received', -- 'received', 'processing', 'success', 'error'
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  related_entity_type TEXT, -- 'order', 'invoice', 'external_invoice', 'subscription', 'store'
  related_entity_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance nas consultas
CREATE INDEX idx_webhook_logs_type ON public.webhook_logs(webhook_type);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_webhook_logs_related ON public.webhook_logs(related_entity_type, related_entity_id);

-- Habilitar RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Apenas service role pode acessar (via edge functions)
-- Master admin pode ler via RLS
CREATE POLICY "Master admin can view webhook logs"
ON public.webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND user_type = 'master_admin'
  )
);

-- Comentário na tabela
COMMENT ON TABLE public.webhook_logs IS 'Logs de todos os webhooks recebidos pelo sistema para monitoramento e debug';