-- Tornar cupom LINKCARD público e aplicável a todos os planos
UPDATE coupons 
SET 
  is_public = true, 
  applies_to = 'all_plans', 
  plan_ids = NULL,
  updated_at = NOW()
WHERE code = 'LINKCARD';