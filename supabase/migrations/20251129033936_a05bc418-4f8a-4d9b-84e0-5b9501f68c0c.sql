-- Adicionar colunas para configuração de método de corte
ALTER TABLE print_configurations 
ADD COLUMN IF NOT EXISTS cut_method TEXT DEFAULT 'visual' 
CHECK (cut_method IN ('driver', 'visual', 'qz_tray'));

ALTER TABLE print_configurations 
ADD COLUMN IF NOT EXISTS qz_tray_printer TEXT;

COMMENT ON COLUMN print_configurations.cut_method IS 'Método de corte: driver (configuração na impressora), visual (linha tracejada), qz_tray (corte automático via QZ Tray)';
COMMENT ON COLUMN print_configurations.qz_tray_printer IS 'Nome da impressora configurada no QZ Tray para corte automático';