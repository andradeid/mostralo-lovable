-- 1. Garantir extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Função reutilizável de limpeza (sem VACUUM interno - autovacuum cuida)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_logs(retention_days integer DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count bigint;
  v_size_before bigint;
  v_size_after bigint;
  v_cutoff timestamptz;
BEGIN
  -- Apenas master_admin pode chamar via API
  IF current_setting('request.jwt.claims', true) IS NOT NULL 
     AND current_setting('request.jwt.claims', true) != '' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'master_admin'
    ) THEN
      RAISE EXCEPTION 'Acesso negado: apenas master_admin pode executar limpeza';
    END IF;
  END IF;

  v_cutoff := now() - (retention_days || ' days')::interval;
  v_size_before := pg_total_relation_size('public.webhook_logs');

  DELETE FROM public.webhook_logs WHERE created_at < v_cutoff;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  v_size_after := pg_total_relation_size('public.webhook_logs');

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'retention_days', retention_days,
    'cutoff_date', v_cutoff,
    'size_before_bytes', v_size_before,
    'size_after_bytes', v_size_after,
    'freed_bytes', GREATEST(v_size_before - v_size_after, 0),
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_webhook_logs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_logs(integer) TO authenticated;

-- 3. Agendar cron diário às 3h da manhã UTC (00h Brasil)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-webhook-logs-daily') THEN
    PERFORM cron.unschedule('cleanup-webhook-logs-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-webhook-logs-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_old_webhook_logs(14); $$
);

-- 4. Limpeza inicial imediata
DELETE FROM public.webhook_logs WHERE created_at < now() - interval '14 days';