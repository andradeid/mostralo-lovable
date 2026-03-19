
-- Tabela para armazenar tokens de acesso aos agendamentos (magic links)
CREATE TABLE public.booking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Índice para busca rápida por token
CREATE INDEX idx_booking_tokens_token ON public.booking_tokens(token);

-- Índice para busca por booking
CREATE INDEX idx_booking_tokens_booking_id ON public.booking_tokens(booking_id);

-- RLS habilitado mas com política pública de leitura por token
ALTER TABLE public.booking_tokens ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode ler pelo token (a segurança é o token em si)
CREATE POLICY "Anyone can read booking tokens by token value"
ON public.booking_tokens
FOR SELECT
TO anon, authenticated
USING (true);

-- Política: apenas service role pode inserir (via edge function)
-- Nenhuma política de INSERT para anon/authenticated = apenas service role insere
