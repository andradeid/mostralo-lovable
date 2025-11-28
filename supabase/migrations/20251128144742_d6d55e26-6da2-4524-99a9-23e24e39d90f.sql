-- Adicionar campos de desconto individual na tabela stores
ALTER TABLE stores 
ADD COLUMN custom_monthly_price numeric DEFAULT NULL,
ADD COLUMN discount_reason text DEFAULT NULL,
ADD COLUMN discount_applied_at timestamp with time zone DEFAULT NULL,
ADD COLUMN discount_applied_by uuid REFERENCES profiles(id) DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN stores.custom_monthly_price IS 'Preço mensal personalizado. Se NULL, usa o preço do plano.';
COMMENT ON COLUMN stores.discount_reason IS 'Motivo do desconto aplicado (ex: Parceria especial, Primeiro cliente)';
COMMENT ON COLUMN stores.discount_applied_at IS 'Data em que o desconto foi aplicado';
COMMENT ON COLUMN stores.discount_applied_by IS 'ID do admin que aplicou o desconto';