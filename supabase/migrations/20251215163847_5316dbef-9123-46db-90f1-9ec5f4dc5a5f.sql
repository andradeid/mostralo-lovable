
-- Atualizar config para TODOS os pagamentos
UPDATE salesperson_commission_configs 
SET applies_to = 'all', updated_at = now()
WHERE salesperson_id = 'd83727c4-f52f-4ed7-bbae-77654123ccd7';

-- Inserir comissão da Loja 008
INSERT INTO salesperson_commissions (
  salesperson_id,
  payment_approval_id,
  store_id,
  payment_amount,
  plan_name,
  commission_type,
  commission_percentage,
  commission_amount,
  payment_sequence,
  applies_to,
  status
) 
SELECT 
  'd83727c4-f52f-4ed7-bbae-77654123ccd7',
  '55dc38c4-9787-4d5f-83af-2975f4185afe',
  pa.store_id,
  pa.payment_amount,
  COALESCE(p.name, 'Essencial'),
  'percentage',
  10,
  pa.payment_amount * 0.10,
  1,
  'all',
  'pending'
FROM payment_approvals pa
LEFT JOIN plans p ON p.id = pa.plan_id
WHERE pa.id = '55dc38c4-9787-4d5f-83af-2975f4185afe';
