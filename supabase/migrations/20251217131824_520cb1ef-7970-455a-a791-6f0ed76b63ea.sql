-- Adicionar campos de credenciais separadas para ambiente de produção
ALTER TABLE subscription_payment_config 
ADD COLUMN IF NOT EXISTS efi_client_id_production TEXT,
ADD COLUMN IF NOT EXISTS efi_client_secret_production TEXT;

-- Comentários para clareza dos campos
COMMENT ON COLUMN subscription_payment_config.efi_client_id IS 'Client ID EFI para ambiente Sandbox/Homologação';
COMMENT ON COLUMN subscription_payment_config.efi_client_secret IS 'Client Secret EFI para ambiente Sandbox/Homologação';
COMMENT ON COLUMN subscription_payment_config.efi_client_id_production IS 'Client ID EFI para ambiente Produção';
COMMENT ON COLUMN subscription_payment_config.efi_client_secret_production IS 'Client Secret EFI para ambiente Produção';