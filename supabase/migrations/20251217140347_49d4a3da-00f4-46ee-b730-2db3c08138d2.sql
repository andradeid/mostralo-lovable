-- Adicionar campos de webhook na tabela subscription_payment_config
ALTER TABLE subscription_payment_config
ADD COLUMN IF NOT EXISTS efi_webhook_configured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS efi_webhook_url text,
ADD COLUMN IF NOT EXISTS efi_webhook_configured_at timestamp with time zone;