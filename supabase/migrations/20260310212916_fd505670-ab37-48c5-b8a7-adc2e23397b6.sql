-- Limpar conversas e mensagens criadas erroneamente pela instância minha-instancia
-- Essas conversas têm phone_number = 556194009368 (o próprio número da loja, não um cliente)
DELETE FROM whatsapp_chat_messages WHERE store_id = 'ddf4a54c-3373-4957-bba9-905e343cc676' AND phone_number = '556194009368';
DELETE FROM whatsapp_conversations WHERE store_id = 'ddf4a54c-3373-4957-bba9-905e343cc676' AND phone_number = '556194009368';