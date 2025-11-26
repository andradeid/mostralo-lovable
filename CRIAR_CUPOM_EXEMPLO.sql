-- ========================================
-- CRIAR CUPOM DE EXEMPLO
-- ========================================
-- Este script cria um cupom de exemplo para testar o sistema
-- ========================================

-- Cupom 1: BLACK90 - 90% OFF (Black Friday)
INSERT INTO coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  applies_to,
  plan_ids,
  max_uses,
  max_uses_per_user,
  start_date,
  end_date,
  status,
  is_public,
  promotion_label,
  show_countdown
) VALUES (
  'BLACK90',
  'Black Friday - 90% OFF',
  'Promoção especial de Black Friday! Não perca esta oportunidade única!',
  'percentage',
  90,
  'all_plans',
  '{}',
  100,
  1,
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  true,
  'BLACK FRIDAY - OFERTA LIMITADA! 🔥',
  true
);

-- Cupom 2: BEMVINDO50 - R$ 50 OFF (Boas-vindas)
INSERT INTO coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  applies_to,
  plan_ids,
  max_uses,
  max_uses_per_user,
  status,
  is_public,
  promotion_label,
  show_countdown
) VALUES (
  'BEMVINDO50',
  'Boas-vindas - R$ 50 OFF',
  'Cupom de boas-vindas para novos clientes',
  'fixed',
  50,
  'all_plans',
  '{}',
  NULL, -- ilimitado
  1,
  'active',
  false, -- não aparece na home
  'SEJA BEM-VINDO!',
  false
);

-- Cupom 3: NATAL25 - 25% OFF (Natal)
INSERT INTO coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  applies_to,
  plan_ids,
  max_uses,
  max_uses_per_user,
  start_date,
  end_date,
  status,
  is_public,
  promotion_label,
  show_countdown
) VALUES (
  'NATAL25',
  'Natal - 25% OFF',
  'Presente de Natal para você! Aproveite 25% de desconto.',
  'percentage',
  25,
  'all_plans',
  '{}',
  200,
  1,
  '2025-12-15 00:00:00+00',
  '2025-12-26 23:59:59+00',
  'active',
  true,
  '🎄 NATAL - OFERTA ESPECIAL!',
  true
);

-- Verificar cupons criados
SELECT 
  code,
  name,
  discount_type,
  discount_value,
  max_uses,
  used_count,
  status,
  is_public,
  CASE 
    WHEN end_date IS NULL THEN 'Sem validade'
    ELSE to_char(end_date, 'DD/MM/YYYY HH24:MI')
  END as expira_em
FROM coupons
ORDER BY created_at DESC;

-- ========================================
-- COMANDOS ÚTEIS
-- ========================================

-- Ver todos os cupons
-- SELECT * FROM coupons ORDER BY created_at DESC;

-- Ver cupons públicos ativos
-- SELECT * FROM coupons WHERE is_public = true AND status = 'active';

-- Ver usos de um cupom específico
-- SELECT * FROM coupon_usages WHERE coupon_id = 'id-do-cupom';

-- Resetar contador de um cupom (para testes)
-- UPDATE coupons SET used_count = 0 WHERE code = 'BLACK90';

-- Deletar todos os cupons de teste
-- DELETE FROM coupons WHERE code IN ('BLACK90', 'BEMVINDO50', 'NATAL25');

