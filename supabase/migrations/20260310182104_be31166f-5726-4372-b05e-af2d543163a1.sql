
-- Criar função para limpar webhook_logs com mais de 7 dias
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.webhook_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;
