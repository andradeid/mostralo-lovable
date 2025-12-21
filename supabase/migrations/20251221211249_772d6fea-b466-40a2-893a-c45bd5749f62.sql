-- Adicionar coluna de orientação na tabela de configuração
ALTER TABLE store_signage_config 
ADD COLUMN orientation TEXT NOT NULL DEFAULT 'horizontal';