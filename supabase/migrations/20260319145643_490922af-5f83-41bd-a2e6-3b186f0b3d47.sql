-- Limpar sessões duplicadas, mantendo apenas a mais recente por config_id+phone_number
DELETE FROM master_whatsapp_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (config_id, phone_number) id
  FROM master_whatsapp_sessions
  ORDER BY config_id, phone_number, created_at DESC
);

-- Adicionar constraint única para evitar duplicatas futuras
ALTER TABLE master_whatsapp_sessions 
  ADD CONSTRAINT unique_config_phone UNIQUE (config_id, phone_number);