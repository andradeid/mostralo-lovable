-- Adicionar coluna para certificado PEM da loja
ALTER TABLE stores ADD COLUMN IF NOT EXISTS efi_certificate_pem TEXT;

-- Adicionar colunas na store_efi_data para rastrear processo de autorização
ALTER TABLE store_efi_data ADD COLUMN IF NOT EXISTS efi_identifier TEXT;
ALTER TABLE store_efi_data ADD COLUMN IF NOT EXISTS authorization_link_sent_at TIMESTAMPTZ;
ALTER TABLE store_efi_data ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ;

-- Adicionar colunas para webhook de contas na configuração principal
ALTER TABLE subscription_payment_config ADD COLUMN IF NOT EXISTS account_webhook_configured BOOLEAN DEFAULT false;
ALTER TABLE subscription_payment_config ADD COLUMN IF NOT EXISTS account_webhook_url TEXT;
ALTER TABLE subscription_payment_config ADD COLUMN IF NOT EXISTS account_webhook_configured_at TIMESTAMPTZ;

-- Criar índice para buscar lojas por identificador EFI
CREATE INDEX IF NOT EXISTS idx_stores_efi_account_id ON stores(efi_account_id) WHERE efi_account_id IS NOT NULL;