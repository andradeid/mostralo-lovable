
-- Tabela para armazenar lembretes de follow-up de leads
CREATE TABLE public.lead_follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'stale_lead',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  days_stale INTEGER,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coluna para controle de lembretes enviados na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_follow_up_reminder_at TIMESTAMPTZ;

-- Índices para performance
CREATE INDEX idx_lead_follow_up_reminders_lead_id ON public.lead_follow_up_reminders(lead_id);
CREATE INDEX idx_lead_follow_up_reminders_user_id ON public.lead_follow_up_reminders(user_id);
CREATE INDEX idx_lead_follow_up_reminders_read_at ON public.lead_follow_up_reminders(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_leads_updated_at_status ON public.leads(updated_at, status) WHERE status IN ('new', 'contacted', 'qualified');

-- Habilitar RLS
ALTER TABLE public.lead_follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Master admin pode ver todos os lembretes
CREATE POLICY "Master admins can view all reminders"
ON public.lead_follow_up_reminders
FOR SELECT
USING (has_role(auth.uid(), 'master_admin'::app_role));

-- Master admin pode gerenciar todos os lembretes
CREATE POLICY "Master admins can manage all reminders"
ON public.lead_follow_up_reminders
FOR ALL
USING (has_role(auth.uid(), 'master_admin'::app_role));

-- Vendedores podem ver seus próprios lembretes
CREATE POLICY "Salespeople can view their own reminders"
ON public.lead_follow_up_reminders
FOR SELECT
USING (user_id = auth.uid());

-- Vendedores podem atualizar seus próprios lembretes (marcar como lido)
CREATE POLICY "Salespeople can update their own reminders"
ON public.lead_follow_up_reminders
FOR UPDATE
USING (user_id = auth.uid());

-- Sistema pode inserir lembretes
CREATE POLICY "System can insert reminders"
ON public.lead_follow_up_reminders
FOR INSERT
WITH CHECK (true);
