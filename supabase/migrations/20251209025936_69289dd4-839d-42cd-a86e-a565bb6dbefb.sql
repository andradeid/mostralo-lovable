-- Adicionar coluna para mensagem personalizada do WhatsApp
ALTER TABLE subscription_payment_config 
ADD COLUMN IF NOT EXISTS support_whatsapp_message TEXT 
DEFAULT 'Olá! Sou {nome} e gostaria de saber mais sobre o Mostralo!';