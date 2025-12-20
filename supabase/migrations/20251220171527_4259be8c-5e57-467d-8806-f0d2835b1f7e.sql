
-- 1. Deletar mensagens com event_type inválido (order_received não é suportado)
DELETE FROM whatsapp_message_queue 
WHERE event_type = 'order_received';

-- 2. Deletar mensagens com telefones claramente inválidos (0800, menos de 10 dígitos)
DELETE FROM whatsapp_message_queue 
WHERE phone_number LIKE '0800%' 
   OR LENGTH(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g')) < 10;
