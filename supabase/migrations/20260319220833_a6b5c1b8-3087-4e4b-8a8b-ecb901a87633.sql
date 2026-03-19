
-- Agendar limpeza diária de tokens expirados (3h da manhã UTC)
SELECT cron.schedule(
  'cleanup-expired-booking-tokens',
  '0 3 * * *',
  $$DELETE FROM public.booking_tokens WHERE expires_at < now()$$
);
