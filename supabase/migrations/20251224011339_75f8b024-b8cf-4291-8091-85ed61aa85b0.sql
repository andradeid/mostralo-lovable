-- Tabela para rate limiting persistente
CREATE TABLE public.rate_limit_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por identifier
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_attempts(identifier);

-- Índice para limpeza de registros antigos
CREATE INDEX idx_rate_limit_first_attempt ON public.rate_limit_attempts(first_attempt_at);

-- RLS desabilitado pois será acessado apenas via service_role
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Função para limpar registros antigos (mais de 1 hora)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts 
  WHERE first_attempt_at < now() - interval '1 hour';
END;
$$;