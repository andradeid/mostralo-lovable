-- Limpeza automática do WhatsApp todo dia às 03:00 UTC (antes: só dia 1 de cada mês).
-- Com 30 dias de retenção, rodar uma vez por mês deixava arquivos por até 60 dias.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'whatsapp-orphan-cleanup-monthly'),
  schedule := '0 3 * * *'
);
-- Conferir:
select jobname, schedule from cron.job where jobname = 'whatsapp-orphan-cleanup-monthly';
