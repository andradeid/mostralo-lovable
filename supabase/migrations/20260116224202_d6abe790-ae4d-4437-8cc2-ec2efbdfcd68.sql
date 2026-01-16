
-- Atualizar o custom_monthly_price da loja Fabricius para refletir o desconto do cupom
UPDATE stores 
SET 
  custom_monthly_price = 147,
  discount_reason = 'Cupom FABRICIUS aplicado - desconto R$250.90 fixo',
  discount_applied_at = NOW()
WHERE id = 'f489bd98-ecf0-466c-9117-6bb7dacd9bda';
