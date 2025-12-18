-- Adicionar coluna efi_pix_enabled na tabela stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS efi_pix_enabled boolean DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.stores.efi_pix_enabled IS 'Indica se PIX Online via EFI está habilitado no checkout da loja';