-- 1. Criar registro de ganhos do Hulk para pedido #0029
INSERT INTO driver_earnings (
  driver_id,
  store_id,
  order_id,
  delivery_assignment_id,
  delivery_fee,
  earnings_amount,
  payment_type,
  commission_percentage,
  payment_status,
  delivered_at
) VALUES (
  'ea967634-16ee-4d8a-a69c-a6b4773aaa52',  -- Hulk
  '79fedd36-6e19-42d6-b331-79f9ad777180',  -- Store
  '44a1d22f-1ca8-4876-affd-1e3cc1a0b2b4',  -- Order #0029
  '282c1b95-5a22-4975-b103-e1cffbbf8f1d',  -- Assignment
  10.00,                                     -- Delivery fee
  8.00,                                      -- Earnings (80% of 10)
  'commission',
  80,
  'pending',
  NOW()
);

-- 2. Corrigir status da atribuição
UPDATE delivery_assignments 
SET status = 'delivered', delivered_at = NOW()
WHERE id = '282c1b95-5a22-4975-b103-e1cffbbf8f1d';