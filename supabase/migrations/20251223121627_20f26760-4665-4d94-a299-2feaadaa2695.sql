-- =====================================================
-- MÓDULO DE FATURAMENTO PARA CLIENTES EXTERNOS
-- =====================================================

-- 1. Tabela de Clientes Externos
CREATE TABLE public.external_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Serviços Externos
CREATE TABLE public.external_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_type TEXT DEFAULT 'fixed' CHECK (billing_type IN ('fixed', 'hourly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Faturas Externas
CREATE TABLE public.external_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  client_id UUID REFERENCES public.external_clients(id) NOT NULL,
  service_id UUID REFERENCES public.external_services(id),
  
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('once', 'monthly', 'quarterly', 'yearly')),
  recurrence_count INTEGER,
  recurrence_current INTEGER DEFAULT 1,
  parent_invoice_id UUID REFERENCES public.external_invoices(id),
  next_due_date DATE,
  
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  pix_txid TEXT,
  pix_copia_cola TEXT,
  pix_qrcode_base64 TEXT,
  pix_expires_at TIMESTAMPTZ,
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_external_clients_active ON public.external_clients(is_active);
CREATE INDEX idx_external_clients_created_by ON public.external_clients(created_by);
CREATE INDEX idx_external_services_active ON public.external_services(is_active);
CREATE INDEX idx_external_invoices_client ON public.external_invoices(client_id);
CREATE INDEX idx_external_invoices_status ON public.external_invoices(payment_status);
CREATE INDEX idx_external_invoices_due_date ON public.external_invoices(due_date);
CREATE INDEX idx_external_invoices_recurring ON public.external_invoices(is_recurring, next_due_date) WHERE is_recurring = true;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_external_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_external_clients_updated_at
  BEFORE UPDATE ON public.external_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_external_clients_updated_at();

CREATE OR REPLACE FUNCTION public.update_external_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_external_services_updated_at
  BEFORE UPDATE ON public.external_services
  FOR EACH ROW EXECUTE FUNCTION public.update_external_services_updated_at();

CREATE OR REPLACE FUNCTION public.update_external_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_external_invoices_updated_at
  BEFORE UPDATE ON public.external_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_external_invoices_updated_at();

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION public.generate_external_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(NULLIF(regexp_replace(invoice_number, '^EXT-' || year_prefix || '-', ''), '')::INTEGER), 0) + 1
  INTO next_number
  FROM public.external_invoices
  WHERE invoice_number LIKE 'EXT-' || year_prefix || '-%';
  
  NEW.invoice_number := 'EXT-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_generate_external_invoice_number
  BEFORE INSERT ON public.external_invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_external_invoice_number();

-- RLS
ALTER TABLE public.external_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_invoices ENABLE ROW LEVEL SECURITY;

-- Policies para master_admin apenas
CREATE POLICY "Master admin full access external_clients"
  ON public.external_clients FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin full access external_services"
  ON public.external_services FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admin full access external_invoices"
  ON public.external_invoices FOR ALL
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Policy pública para visualização de fatura (para pagamento)
CREATE POLICY "Public view external invoice for payment"
  ON public.external_invoices FOR SELECT
  USING (true);