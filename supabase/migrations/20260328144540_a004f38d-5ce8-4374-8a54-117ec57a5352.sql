
-- Tabela de tokens de acesso rápido para clientes (Magic Link / 1-Click Checkout)
CREATE TABLE public.customer_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '180 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_store_token UNIQUE (customer_id, store_id)
);

-- Índices para buscas rápidas
CREATE INDEX idx_customer_tokens_token ON public.customer_tokens(token);
CREATE INDEX idx_customer_tokens_customer_store ON public.customer_tokens(customer_id, store_id);

-- Habilitar RLS
ALTER TABLE public.customer_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: apenas service_role pode acessar (Edge Functions)
CREATE POLICY "Service role full access on customer_tokens"
ON public.customer_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Função para gerar/renovar token (upsert atômico)
CREATE OR REPLACE FUNCTION public.generate_customer_token(
    p_customer_id UUID,
    p_store_id UUID
)
RETURNS TABLE(new_token UUID, new_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token UUID;
    v_expires TIMESTAMPTZ;
BEGIN
    v_token := gen_random_uuid();
    v_expires := NOW() + INTERVAL '180 days';

    INSERT INTO customer_tokens (customer_id, store_id, token, expires_at)
    VALUES (p_customer_id, p_store_id, v_token, v_expires)
    ON CONFLICT (customer_id, store_id)
    DO UPDATE SET
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at;

    RETURN QUERY SELECT v_token, v_expires;
END;
$$;
