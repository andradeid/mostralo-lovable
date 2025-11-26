-- Corrigir promoção "Primeiro pedido" para ter desconto de 20%
UPDATE promotions 
SET 
  discount_percentage = 20,
  updated_at = NOW()
WHERE 
  name = 'Primeiro pedido' 
  AND discount_percentage IS NULL;