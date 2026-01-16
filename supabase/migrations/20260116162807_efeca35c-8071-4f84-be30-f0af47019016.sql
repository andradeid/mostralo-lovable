-- Adicionar colunas para comprovante de pagamento na tabela professional_commissions
ALTER TABLE public.professional_commissions
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;