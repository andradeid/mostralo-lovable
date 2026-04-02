-- Tabela de configuração de automação de cobranças
CREATE TABLE public.subscription_billing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  notify_days_before INT NOT NULL DEFAULT 1,
  notify_on_due_date BOOLEAN NOT NULL DEFAULT true,
  overdue_notify_count INT NOT NULL DEFAULT 3,
  overdue_notify_interval_days INT NOT NULL DEFAULT 3,
  auto_send_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.subscription_billing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_admin can manage billing config"
ON public.subscription_billing_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Tabela de log de notificações enviadas
CREATE TABLE public.subscription_invoice_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.subscription_invoices(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('before_due', 'on_due', 'overdue')),
  overdue_sequence INT DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_invoice_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_admin can view notification logs"
ON public.subscription_invoice_notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Índices para performance
CREATE INDEX idx_billing_config_store ON public.subscription_billing_config(store_id);
CREATE INDEX idx_invoice_notifications_invoice ON public.subscription_invoice_notifications(invoice_id);
CREATE INDEX idx_invoice_notifications_store ON public.subscription_invoice_notifications(store_id);
CREATE INDEX idx_invoice_notifications_type ON public.subscription_invoice_notifications(notification_type, sent_at);

-- Trigger para updated_at
CREATE TRIGGER update_subscription_billing_config_updated_at
BEFORE UPDATE ON public.subscription_billing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração global padrão (store_id = null)
INSERT INTO public.subscription_billing_config (store_id, notify_days_before, notify_on_due_date, overdue_notify_count, overdue_notify_interval_days, auto_send_enabled)
VALUES (NULL, 1, true, 3, 3, false);