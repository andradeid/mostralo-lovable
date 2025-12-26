-- Associar módulos faltantes aos planos Profissional e Premium

-- 1. Adicionar self_service_table ao Profissional e Premium
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id
FROM plans p
CROSS JOIN modules m
WHERE p.name IN ('Profissional', 'Premium')
AND m.key = 'self_service_table'
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- 2. Adicionar kds ao Profissional e Premium
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id
FROM plans p
CROSS JOIN modules m
WHERE p.name IN ('Profissional', 'Premium')
AND m.key = 'kds'
ON CONFLICT (plan_id, module_id) DO NOTHING;

-- 3. Adicionar pdv_comandas ao Profissional e Premium
INSERT INTO plan_modules (plan_id, module_id)
SELECT p.id, m.id
FROM plans p
CROSS JOIN modules m
WHERE p.name IN ('Profissional', 'Premium')
AND m.key = 'pdv_comandas'
ON CONFLICT (plan_id, module_id) DO NOTHING;