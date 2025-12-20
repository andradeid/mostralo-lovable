
-- Limpar mensagens de teste com telefone 44444444444 que só gera erros
DELETE FROM whatsapp_message_queue 
WHERE phone_number = '44444444444';
