-- Adicionar coluna print_copies na tabela print_configurations
ALTER TABLE print_configurations 
ADD COLUMN IF NOT EXISTS print_copies jsonb DEFAULT '{"complete": true, "kitchen": false, "delivery": false}'::jsonb;