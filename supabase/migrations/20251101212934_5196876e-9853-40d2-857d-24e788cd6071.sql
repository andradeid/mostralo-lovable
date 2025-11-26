-- Adicionar coluna deleted_at na tabela customers (se não existir)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;