-- Adicionar coluna para certificado de produção (o existente será usado como sandbox)
ALTER TABLE subscription_payment_config 
ADD COLUMN IF NOT EXISTS efi_certificate_pem_production TEXT;

-- Adicionar comentário para clareza
COMMENT ON COLUMN subscription_payment_config.efi_certificate_pem IS 'Certificado PEM para ambiente Sandbox/Homologação';
COMMENT ON COLUMN subscription_payment_config.efi_certificate_pem_production IS 'Certificado PEM para ambiente Produção';