-- Adicionar campos para suporte a pagamento PIX automático em faturas
ALTER TABLE public.subscription_invoices 
ADD COLUMN IF NOT EXISTS pix_txid TEXT,
ADD COLUMN IF NOT EXISTS pix_copia_cola TEXT,
ADD COLUMN IF NOT EXISTS pix_qrcode_base64 TEXT,
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;

-- Adicionar índice para busca por txid (usado pelo webhook)
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_pix_txid 
ON public.subscription_invoices(pix_txid) 
WHERE pix_txid IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.subscription_invoices.pix_txid IS 'ID da transação PIX gerado pela EFI';
COMMENT ON COLUMN public.subscription_invoices.pix_copia_cola IS 'Código PIX copia e cola para pagamento';
COMMENT ON COLUMN public.subscription_invoices.pix_qrcode_base64 IS 'QR Code PIX em base64 para exibição';
COMMENT ON COLUMN public.subscription_invoices.pix_expires_at IS 'Data/hora de expiração do QR Code PIX';