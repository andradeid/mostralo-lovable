
-- Atualizar valores de referência de mercado para módulos Core
UPDATE modules 
SET price_reference = 'Goomer R$ 99,90/mês, Consumer R$ 44,90/mês, Anota AI R$ 279,99/mês'
WHERE key = 'digital_menu';

UPDATE modules 
SET price_reference = 'Goomer Delivery R$ 99,90/mês, BeeFood R$ 140/mês, Saipos a partir de R$ 219/mês'
WHERE key = 'delivery';

UPDATE modules 
SET price_reference = 'Goomer R$ 99,90/mês (incluso), Consumer R$ 44,90/mês, Anota AI R$ 279,99/mês'
WHERE key = 'order_management';

UPDATE modules 
SET price_reference = 'White label apps R$ 200-500/mês, Goomer identidade visual R$ 99,90/mês'
WHERE key = 'customization';

UPDATE modules 
SET price_reference = 'Consumer Connect R$ 44,90/mês, BeeFood Rainha R$ 200/mês (avançado), Saipos R$ 219/mês'
WHERE key = 'reports';
