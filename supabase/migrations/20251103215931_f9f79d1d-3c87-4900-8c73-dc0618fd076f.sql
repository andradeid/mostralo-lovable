-- Gerar mensalidades iniciais para lojas com plano ativo
INSERT INTO subscription_invoices (
  store_id,
  plan_id,
  amount,
  due_date,
  payment_status
)
SELECT 
  s.id as store_id,
  s.plan_id,
  p.price as amount,
  s.subscription_expires_at as due_date,
  CASE 
    WHEN s.subscription_expires_at < NOW() THEN 'overdue'
    ELSE 'pending'
  END as payment_status
FROM stores s
JOIN plans p ON p.id = s.plan_id
WHERE s.plan_id IS NOT NULL
  AND s.subscription_expires_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscription_invoices si
    WHERE si.store_id = s.id 
    AND si.due_date = s.subscription_expires_at
  );
