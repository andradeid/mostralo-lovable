
-- Agendar limpeza semanal dos webhook_logs (toda segunda às 3h da manhã)
SELECT cron.schedule(
  'cleanup-webhook-logs-weekly',
  '0 3 * * 1',
  $$SELECT public.cleanup_old_webhook_logs()$$
);
