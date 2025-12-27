-- Adicionar colunas de preço sugerido, referência e dependências na tabela modules
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS price_reference TEXT,
ADD COLUMN IF NOT EXISTS dependencies TEXT;