-- Inserir módulo digital_signage
INSERT INTO modules (name, description, key, icon, is_active)
VALUES (
  'Painel Digital', 
  'Exiba promoções, cardápios e conteúdo em TVs e totens de forma profissional', 
  'digital_signage', 
  'Monitor', 
  true
);

-- Vincular a todos os planos existentes
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id
FROM plans p
CROSS JOIN modules m
WHERE m.key = 'digital_signage';