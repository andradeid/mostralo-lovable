-- Corrigir pedido #0030 do Hulk com o order_id correto
UPDATE driver_earnings 
SET 
  earnings_amount = 20.00,
  minimum_amount = 20.00
WHERE order_id = '10c2a710-1bd7-4fa4-bed2-ac2fa09cfbce';