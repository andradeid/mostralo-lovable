-- Agendar avaliação trimestral de carteiras de vendedores
-- Executa no primeiro dia de Janeiro, Abril, Julho e Outubro às 00:00 UTC
SELECT cron.schedule(
  'evaluate-portfolios-quarterly',
  '0 0 1 1,4,7,10 *',
  $$
  SELECT net.http_post(
    url:='https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/evaluate-salesperson-portfolios',
    headers:='{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA", "Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);