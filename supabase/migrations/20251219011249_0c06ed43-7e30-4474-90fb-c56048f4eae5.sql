-- Limpar pedidos duplicados existentes
-- Manter apenas o pedido mais antigo para cada external_id

-- 1. Deletar duplicatas (manter só o mais antigo)
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE external_id = 'e6261578-ab9a-460c-8519-90bafe660859'
    AND id != '52856f47-2dc8-4cfa-abd0-8e8576600d17'
);

DELETE FROM orders 
WHERE external_id = 'e6261578-ab9a-460c-8519-90bafe660859'
  AND id != '52856f47-2dc8-4cfa-abd0-8e8576600d17';

-- 2. Sincronizar status do pedido restante (já estava cancelado)
UPDATE orders SET 
  status = 'cancelado',
  cancelled_at = COALESCE(cancelled_at, '2025-12-19 00:47:42+00'),
  cancellation_reason = COALESCE(cancellation_reason, 'A loja está passando por dificuldades internas'),
  updated_at = now()
WHERE external_id = 'e6261578-ab9a-460c-8519-90bafe660859';