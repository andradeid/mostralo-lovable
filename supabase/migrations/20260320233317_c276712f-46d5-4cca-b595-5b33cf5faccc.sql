
-- =============================================
-- TABELA: store_payment_gateways
-- Credenciais do Mercado Pago por loja
-- =============================================
CREATE TABLE public.store_payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'mercado_pago',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  access_token TEXT, -- Token privado do MP
  public_key TEXT,   -- Chave pública do MP
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, gateway)
);

-- RLS: NINGUÉM lê access_token/public_key diretamente
ALTER TABLE public.store_payment_gateways ENABLE ROW LEVEL SECURITY;

-- Lojista pode ver metadados (sem tokens) da sua loja
CREATE POLICY "store_owner_select_gateway_metadata"
ON public.store_payment_gateways FOR SELECT
TO authenticated
USING (
  public.is_store_admin_of(store_id)
);

-- Lojista pode inserir para sua loja
CREATE POLICY "store_owner_insert_gateway"
ON public.store_payment_gateways FOR INSERT
TO authenticated
WITH CHECK (
  public.is_store_admin_of(store_id)
);

-- Lojista pode atualizar da sua loja
CREATE POLICY "store_owner_update_gateway"
ON public.store_payment_gateways FOR UPDATE
TO authenticated
USING (
  public.is_store_admin_of(store_id)
);

-- Lojista pode deletar da sua loja
CREATE POLICY "store_owner_delete_gateway"
ON public.store_payment_gateways FOR DELETE
TO authenticated
USING (
  public.is_store_admin_of(store_id)
);

-- Trigger updated_at
CREATE TRIGGER update_store_payment_gateways_updated_at
  BEFORE UPDATE ON public.store_payment_gateways
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_updated_at();

-- =============================================
-- TABELA: store_payment_transactions
-- Log de transações de pagamento por módulo
-- =============================================
CREATE TABLE public.store_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'mercado_pago',
  gateway_payment_id TEXT,
  module TEXT NOT NULL CHECK (module IN ('order', 'booking', 'totem', 'subscription')),
  reference_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled', 'in_process', 'expired')),
  payment_method TEXT,
  payer_email TEXT,
  payer_name TEXT,
  gateway_response JSONB,
  external_reference TEXT,
  checkout_url TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  webhook_received_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Lojista pode ver transações da sua loja
CREATE POLICY "store_owner_select_transactions"
ON public.store_payment_transactions FOR SELECT
TO authenticated
USING (
  public.is_store_admin_of(store_id)
);

-- Inserção apenas via service_role (edge functions)
-- Não permitir insert direto do frontend
CREATE POLICY "service_role_insert_transactions"
ON public.store_payment_transactions FOR INSERT
TO service_role
WITH CHECK (true);

-- Update apenas via service_role
CREATE POLICY "service_role_update_transactions"
ON public.store_payment_transactions FOR UPDATE
TO service_role
USING (true);

-- Trigger updated_at
CREATE TRIGGER update_store_payment_transactions_updated_at
  BEFORE UPDATE ON public.store_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_updated_at();

-- Índices para performance
CREATE INDEX idx_store_payment_gateways_store ON public.store_payment_gateways(store_id);
CREATE INDEX idx_store_payment_transactions_store ON public.store_payment_transactions(store_id);
CREATE INDEX idx_store_payment_transactions_reference ON public.store_payment_transactions(module, reference_id);
CREATE INDEX idx_store_payment_transactions_gateway_id ON public.store_payment_transactions(gateway_payment_id);
CREATE INDEX idx_store_payment_transactions_external_ref ON public.store_payment_transactions(external_reference);
CREATE INDEX idx_store_payment_transactions_status ON public.store_payment_transactions(store_id, status);
