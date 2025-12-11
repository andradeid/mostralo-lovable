-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Conceder permissão para usar pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Agendar reset mensal de ganhos de afiliados
-- Executa no dia 1º de cada mês às 00:01 UTC
SELECT cron.schedule(
  'reset-affiliate-monthly-earnings',
  '1 0 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/reset-monthly-affiliate-earnings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body := '{"source": "cron_job"}'::jsonb
  );
  $$
);