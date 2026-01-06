-- Criar tabela para logs de notificações de agendamentos
CREATE TABLE public.booking_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('confirmation', 'reminder', 'review')),
  send_method TEXT NOT NULL CHECK (send_method IN ('automatic', 'manual')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_booking_notification_logs_booking ON public.booking_notification_logs(booking_id);
CREATE INDEX idx_booking_notification_logs_store ON public.booking_notification_logs(store_id);
CREATE INDEX idx_booking_notification_logs_type ON public.booking_notification_logs(notification_type);

-- Habilitar RLS
ALTER TABLE public.booking_notification_logs ENABLE ROW LEVEL SECURITY;

-- Política para donos da loja visualizarem logs
CREATE POLICY "Store owner can view notification logs"
ON public.booking_notification_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = booking_notification_logs.store_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Política para inserção (via edge functions usando service role)
CREATE POLICY "Allow insert from service role"
ON public.booking_notification_logs FOR INSERT
WITH CHECK (true);

-- Comentário na tabela
COMMENT ON TABLE public.booking_notification_logs IS 'Histórico de notificações enviadas para agendamentos (confirmação, lembrete, avaliação)';