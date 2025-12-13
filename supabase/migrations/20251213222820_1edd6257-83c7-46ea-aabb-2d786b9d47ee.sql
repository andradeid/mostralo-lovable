-- Adicionar campos de bloqueio na tabela salespeople
ALTER TABLE salespeople
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS blocked_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS blocked_reason text;