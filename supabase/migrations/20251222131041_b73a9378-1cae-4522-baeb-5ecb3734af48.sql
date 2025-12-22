-- Adicionar colunas para vincular chamada ao pedido real
ALTER TABLE password_calls
ADD COLUMN order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN customer_name text;

-- Adicionar configuração para habilitar botão de chamar no modal de pedido
ALTER TABLE password_call_config
ADD COLUMN enable_order_call_button boolean DEFAULT false;