-- Adicionar colunas de agendamento do SENTINELA na tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_send_hour INTEGER DEFAULT 10;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_send_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri'];
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_timezone TEXT DEFAULT 'America/Sao_Paulo';

-- Comentários para documentação
COMMENT ON COLUMN stores.sentinela_send_hour IS 'Hora do dia (0-23) para envio automático das mensagens SENTINELA';
COMMENT ON COLUMN stores.sentinela_send_days IS 'Dias da semana para envio (mon,tue,wed,thu,fri,sat,sun)';
COMMENT ON COLUMN stores.sentinela_timezone IS 'Timezone para cálculo do horário de envio';