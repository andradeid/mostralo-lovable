-- Parte 1: Adicionar sistema de numeração sequencial de pedidos
-- Adicionar coluna para controlar último número de pedido por loja
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_order_number INTEGER DEFAULT 0;

-- Criar função para gerar próximo número de pedido
CREATE OR REPLACE FUNCTION get_next_order_number(store_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Incrementar e retornar o próximo número atomicamente
  UPDATE stores
  SET last_order_number = last_order_number + 1
  WHERE id = store_uuid
  RETURNING last_order_number INTO next_number;
  
  -- Formatar o número com 4 dígitos (0001, 0002, etc)
  RETURN LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Parte 2: Adicionar detalhes de pagamento para diferenciar tipo de cartão
-- Adicionar coluna para armazenar detalhes de pagamento (tipo de cartão, etc)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Comentários para documentação
COMMENT ON COLUMN stores.last_order_number IS 'Contador sequencial de pedidos por loja';
COMMENT ON COLUMN orders.payment_details IS 'Detalhes adicionais do pagamento (ex: {"card_type": "credit"} ou {"card_type": "debit"})';