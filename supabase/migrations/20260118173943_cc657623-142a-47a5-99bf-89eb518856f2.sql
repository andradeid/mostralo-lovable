-- Adicionar colunas para rastrear aceite de termos e LGPD
ALTER TABLE commercial_proposals 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lgpd_accepted BOOLEAN DEFAULT FALSE;