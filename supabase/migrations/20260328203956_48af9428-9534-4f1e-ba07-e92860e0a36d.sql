
-- Agendar housekeeping diário às 4h da manhã (UTC)
SELECT cron.schedule(
  'daily-housekeeping',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/housekeeping',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
