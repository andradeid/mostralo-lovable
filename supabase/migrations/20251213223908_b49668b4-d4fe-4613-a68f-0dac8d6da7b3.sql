-- Adicionar coluna support_email se não existir
ALTER TABLE subscription_payment_config
ADD COLUMN IF NOT EXISTS support_email text DEFAULT 'suporte@mostralo.com';