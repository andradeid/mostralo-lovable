-- Remover CRON antigo (4h)
SELECT cron.unschedule('update-bots-greeting-every-4h');

-- Criar novo CRON (1h)
SELECT cron.schedule(
  'update-bots-greeting-every-hour',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/update-bots-greeting',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);