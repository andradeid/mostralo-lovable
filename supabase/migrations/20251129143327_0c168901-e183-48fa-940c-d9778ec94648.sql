-- Remove constraint global de order_number
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_key;

-- Cria constraint única por loja (store_id + order_number)
ALTER TABLE orders 
ADD CONSTRAINT orders_order_number_store_unique 
UNIQUE (store_id, order_number);