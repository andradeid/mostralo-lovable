-- Limpar fila de WhatsApp: remover mensagens antigas/inúteis
-- 30 mensagens processing (travadas de 10-14/Dez)
-- 9 mensagens skipped (ignoradas)

DELETE FROM whatsapp_message_queue 
WHERE status = 'processing';

DELETE FROM whatsapp_message_queue 
WHERE status = 'skipped';