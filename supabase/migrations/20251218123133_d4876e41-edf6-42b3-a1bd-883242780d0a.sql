-- Adicionar campo para número da conta EFI do lojista (fluxo manual)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS efi_account_number TEXT;

-- Comentário explicativo
COMMENT ON COLUMN stores.efi_account_number IS 'Número da conta EFI do lojista para receber pagamentos via Split Payment';