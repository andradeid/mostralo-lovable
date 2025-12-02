-- Adicionar novo valor ao enum payment_type
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'minimum_guaranteed';

-- Adicionar coluna minimum_amount em driver_earnings_config
ALTER TABLE driver_earnings_config 
ADD COLUMN IF NOT EXISTS minimum_amount numeric;

-- Adicionar coluna minimum_amount em driver_earnings (para histórico)
ALTER TABLE driver_earnings 
ADD COLUMN IF NOT EXISTS minimum_amount numeric;