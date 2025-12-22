-- Adicionar colunas de configuração do relógio
ALTER TABLE store_signage_config 
ADD COLUMN IF NOT EXISTS clock_position text NOT NULL DEFAULT 'right',
ADD COLUMN IF NOT EXISTS clock_size text NOT NULL DEFAULT 'medium';

-- Adicionar constraint para validar valores de clock_position
ALTER TABLE store_signage_config
ADD CONSTRAINT check_clock_position CHECK (clock_position IN ('left', 'center', 'right'));

-- Adicionar constraint para validar valores de clock_size
ALTER TABLE store_signage_config
ADD CONSTRAINT check_clock_size CHECK (clock_size IN ('small', 'medium', 'large'));