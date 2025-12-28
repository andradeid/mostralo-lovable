-- ============================================
-- APLICAR ETIQUETAS RETROATIVAS NOS CLIENTES
-- Baseado no histórico de pedidos existentes
-- ============================================

-- 1. Aplicar etiqueta "Balcão" para clientes com pedidos source = 'manual'
INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
SELECT DISTINCT 
  o.customer_id,
  cl.id as label_id,
  o.store_id
FROM orders o
JOIN customer_labels cl ON cl.store_id = o.store_id AND cl.name = 'Balcão'
WHERE o.customer_id IS NOT NULL
  AND o.source = 'manual'
  AND NOT EXISTS (
    SELECT 1 FROM customer_label_assignments cla 
    WHERE cla.customer_id = o.customer_id AND cla.label_id = cl.id
  );

-- 2. Aplicar etiqueta "Delivery" para clientes com pedidos delivery
INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
SELECT DISTINCT 
  o.customer_id,
  cl.id as label_id,
  o.store_id
FROM orders o
JOIN customer_labels cl ON cl.store_id = o.store_id AND cl.name = 'Delivery'
WHERE o.customer_id IS NOT NULL
  AND o.delivery_type = 'delivery'
  AND NOT EXISTS (
    SELECT 1 FROM customer_label_assignments cla 
    WHERE cla.customer_id = o.customer_id AND cla.label_id = cl.id
  );

-- 3. Aplicar etiqueta "Cardápio na Mesa" para clientes com comandas self_service
INSERT INTO customer_label_assignments (customer_id, label_id, store_id)
SELECT DISTINCT 
  co.customer_id,
  cl.id as label_id,
  co.store_id
FROM comandas co
JOIN customer_labels cl ON cl.store_id = co.store_id AND cl.name = 'Cardápio na Mesa'
WHERE co.customer_id IS NOT NULL
  AND co.source = 'self_service'
  AND NOT EXISTS (
    SELECT 1 FROM customer_label_assignments cla 
    WHERE cla.customer_id = co.customer_id AND cla.label_id = cl.id
  );