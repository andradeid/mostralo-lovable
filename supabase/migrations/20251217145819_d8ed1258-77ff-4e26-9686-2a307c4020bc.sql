-- Criar invoice para o pagamento PIX já processado
INSERT INTO subscription_invoices (
  store_id, plan_id, amount, due_date, paid_at, 
  payment_status, payment_method, notes, approved_at
) 
SELECT 
  pa.store_id,
  pa.plan_id,
  pa.payment_amount,
  NOW(),
  NOW(),
  'paid',
  'pix',
  'Pagamento PIX confirmado automaticamente via EFI - EndToEndId: E00416968202512171446vBQbXc6Ku1Q',
  pa.approved_at
FROM payment_approvals pa
WHERE pa.id = '93bb0e6d-0a01-43cd-ba26-0d8f10b78784'
AND NOT EXISTS (
  SELECT 1 FROM subscription_invoices si 
  WHERE si.store_id = pa.store_id 
  AND si.paid_at::date = CURRENT_DATE
);