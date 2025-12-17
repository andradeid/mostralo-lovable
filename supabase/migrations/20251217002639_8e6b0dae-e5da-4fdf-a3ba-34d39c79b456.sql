-- Agendar CRON job para reativação automática de bots a cada 5 minutos
SELECT cron.schedule(
  'reactivate-bots-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/whatsapp-bot-reactivate',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xppEAA"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);