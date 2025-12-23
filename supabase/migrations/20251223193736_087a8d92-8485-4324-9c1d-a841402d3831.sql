-- Cron Job 1: SENTINELA-CHECK às 08:00 (horário de Brasília = 11:00 UTC)
-- Verifica clientes que precisam receber lembretes e cria os registros
SELECT cron.schedule(
  'sentinela-check-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/sentinela-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron Job 2: SENTINELA-SEND às 10:00 (horário de Brasília = 13:00 UTC)
-- Envia as mensagens dos lembretes pendentes
SELECT cron.schedule(
  'sentinela-send-daily',
  '0 13 * * *',
  $$
  SELECT net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/sentinela-send',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);