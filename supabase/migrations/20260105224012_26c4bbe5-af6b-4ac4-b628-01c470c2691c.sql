-- =====================================================
-- SENTINELA: ROI, Pausa e Anti-Banimento
-- =====================================================

-- 1. Adicionar coluna para valor da conversão (ROI)
ALTER TABLE sentinela_reminders ADD COLUMN IF NOT EXISTS converted_order_value NUMERIC(10,2);

-- 2. Colunas de pausa por período
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_pause_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_pause_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_pause_reason TEXT;

-- 3. Colunas de configuração anti-banimento
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_interval_seconds INTEGER DEFAULT 60;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_pause_after_messages INTEGER DEFAULT 10;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sentinela_pause_duration_seconds INTEGER DEFAULT 120;

-- 4. Atualizar função do trigger para incluir valor do pedido na conversão
CREATE OR REPLACE FUNCTION mark_sentinela_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar lembretes enviados nos últimos 7 dias como convertidos
  UPDATE sentinela_reminders
  SET 
    converted_at = NOW(),
    converted_order_id = NEW.id,
    converted_order_value = NEW.total
  WHERE 
    customer_id = NEW.customer_id
    AND store_id = NEW.store_id
    AND status = 'sent'
    AND converted_at IS NULL
    AND sent_at > NOW() - INTERVAL '7 days';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON COLUMN sentinela_reminders.converted_order_value IS 'Valor do pedido que resultou da conversão do lembrete';
COMMENT ON COLUMN stores.sentinela_paused IS 'Se true, pausa imediata de todos os envios do SENTINELA';
COMMENT ON COLUMN stores.sentinela_pause_start IS 'Data/hora de início da pausa agendada';
COMMENT ON COLUMN stores.sentinela_pause_end IS 'Data/hora de fim da pausa agendada';
COMMENT ON COLUMN stores.sentinela_pause_reason IS 'Motivo da pausa (férias, feriado, etc)';
COMMENT ON COLUMN stores.sentinela_interval_seconds IS 'Intervalo em segundos entre cada mensagem do SENTINELA';
COMMENT ON COLUMN stores.sentinela_pause_after_messages IS 'Quantidade de mensagens antes de pausar';
COMMENT ON COLUMN stores.sentinela_pause_duration_seconds IS 'Duração da pausa em segundos após X mensagens';