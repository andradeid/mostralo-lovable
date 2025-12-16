
-- Criar CRON job para atualizar saudações dos bots a cada 4 horas
-- Horários: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
SELECT cron.schedule(
  'update-bots-greeting-every-4h',
  '0 0,4,8,12,16,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/update-bots-greeting',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
