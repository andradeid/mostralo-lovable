-- Adicionar campos de documento EFI na tabela stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS efi_document_type TEXT DEFAULT 'cpf',
ADD COLUMN IF NOT EXISTS efi_document_number TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.stores.efi_document_type IS 'Tipo de documento do titular da conta EFI (cpf ou cnpj)';
COMMENT ON COLUMN public.stores.efi_document_number IS 'Número do documento (CPF ou CNPJ) do titular da conta EFI';