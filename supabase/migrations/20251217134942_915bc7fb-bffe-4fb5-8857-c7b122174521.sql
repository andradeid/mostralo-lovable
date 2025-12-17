-- Adicionar campos PIX na tabela payment_approvals
ALTER TABLE payment_approvals 
ADD COLUMN IF NOT EXISTS pix_txid TEXT,
ADD COLUMN IF NOT EXISTS pix_location TEXT,
ADD COLUMN IF NOT EXISTS pix_qrcode_base64 TEXT,
ADD COLUMN IF NOT EXISTS pix_copia_cola TEXT,
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMPTZ;