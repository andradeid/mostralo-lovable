-- Corrigir pedido #0030: atualizar delivery_assignments para 'delivered'
-- Isso vai acionar o trigger calculate_driver_earnings e criar o registro
UPDATE delivery_assignments 
SET 
  status = 'delivered',
  delivered_at = NOW()
WHERE id = '05689128-2dbc-46cd-8973-a59a4e6e0796';