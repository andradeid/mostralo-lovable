-- Adicionar campo master_referral_code na tabela de configuração
ALTER TABLE subscription_payment_config 
ADD COLUMN IF NOT EXISTS master_referral_code TEXT DEFAULT 'MOSTRALO';