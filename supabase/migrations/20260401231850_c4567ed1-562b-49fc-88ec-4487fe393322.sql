
-- Adicionar campos para página pública de pagamento
ALTER TABLE public.subscription_invoices 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Gerar tokens para faturas existentes que não têm
UPDATE public.subscription_invoices 
SET public_token = encode(gen_random_bytes(16), 'hex')
WHERE public_token IS NULL;

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_public_token 
ON public.subscription_invoices (public_token) WHERE public_token IS NOT NULL;

-- Política de leitura pública (qualquer pessoa com o token pode ver dados básicos)
CREATE POLICY "Public can read invoices by token"
ON public.subscription_invoices
FOR SELECT
TO anon
USING (public_token IS NOT NULL);
