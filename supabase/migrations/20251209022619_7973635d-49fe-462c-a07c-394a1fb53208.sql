-- Criar tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados do Lead
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_phone TEXT,
  city TEXT NOT NULL,
  state TEXT,
  monthly_revenue TEXT,
  business_type TEXT,
  uses_ifood BOOLEAN,
  
  -- Rastreamento de Origem
  referral_code TEXT,
  salesperson_id UUID REFERENCES public.salespeople(id),
  source TEXT DEFAULT 'website',
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Status e Acompanhamento
  status TEXT DEFAULT 'new',
  notes TEXT,
  
  -- Metadados
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_leads_salesperson_id ON public.leads(salesperson_id);
CREATE INDEX idx_leads_referral_code ON public.leads(referral_code);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Master admins can view all leads"
ON public.leads FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Salespeople can view their leads"
ON public.leads FOR SELECT
USING (
  salesperson_id IN (
    SELECT id FROM public.salespeople WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can create leads"
ON public.leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Master admins can update all leads"
ON public.leads FOR UPDATE
USING (has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Salespeople can update their leads"
ON public.leads FOR UPDATE
USING (
  salesperson_id IN (
    SELECT id FROM public.salespeople WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Master admins can delete leads"
ON public.leads FOR DELETE
USING (has_role(auth.uid(), 'master_admin'));

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna de WhatsApp de suporte na config
ALTER TABLE public.subscription_payment_config 
ADD COLUMN IF NOT EXISTS support_whatsapp TEXT;