-- Adicionar coluna phone na tabela professionals
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Índice para buscas por telefone
CREATE INDEX IF NOT EXISTS idx_professionals_phone 
ON professionals(phone) WHERE phone IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN professionals.phone IS 
'Número do WhatsApp do profissional no formato E.164 (ex: 5561999999999)';