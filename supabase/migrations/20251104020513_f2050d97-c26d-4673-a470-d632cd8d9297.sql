-- Adicionar campo de impressão automática na tabela print_configurations
ALTER TABLE print_configurations 
ADD COLUMN auto_print_on_accept boolean DEFAULT false;

COMMENT ON COLUMN print_configurations.auto_print_on_accept IS 'Se verdadeiro, abre automaticamente o diálogo de impressão ao aceitar pedido';