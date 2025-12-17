-- Adicionar campos EFI na tabela subscription_payment_config
ALTER TABLE subscription_payment_config 
ADD COLUMN IF NOT EXISTS efi_client_id TEXT,
ADD COLUMN IF NOT EXISTS efi_client_secret TEXT,
ADD COLUMN IF NOT EXISTS efi_certificate_pem TEXT,
ADD COLUMN IF NOT EXISTS efi_pix_key TEXT,
ADD COLUMN IF NOT EXISTS efi_environment TEXT DEFAULT 'sandbox',
ADD COLUMN IF NOT EXISTS efi_is_configured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS efi_last_test_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS efi_last_test_status TEXT;

-- Comentários para documentação
COMMENT ON COLUMN subscription_payment_config.efi_client_id IS 'Client ID da aplicação EFI/Gerencianet';
COMMENT ON COLUMN subscription_payment_config.efi_client_secret IS 'Client Secret da aplicação EFI';
COMMENT ON COLUMN subscription_payment_config.efi_certificate_pem IS 'Certificado PEM para autenticação mTLS';
COMMENT ON COLUMN subscription_payment_config.efi_pix_key IS 'Chave PIX EVP (aleatória) para recebimentos';
COMMENT ON COLUMN subscription_payment_config.efi_environment IS 'Ambiente: sandbox ou production';
COMMENT ON COLUMN subscription_payment_config.efi_is_configured IS 'Indica se as credenciais foram configuradas';
COMMENT ON COLUMN subscription_payment_config.efi_last_test_at IS 'Data/hora do último teste de conexão';
COMMENT ON COLUMN subscription_payment_config.efi_last_test_status IS 'Status do último teste: success ou mensagem de erro';