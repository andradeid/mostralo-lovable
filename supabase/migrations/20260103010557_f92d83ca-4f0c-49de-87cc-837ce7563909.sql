-- Criar cupom DIAG20 para leads Elite (20% desconto)
INSERT INTO public.coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  applies_to,
  is_public,
  status,
  start_date,
  end_date,
  max_uses,
  max_uses_per_user
) VALUES (
  'DIAG20',
  'Desconto Diagnóstico Elite',
  'Cupom exclusivo para leads Elite do diagnóstico - 20% de desconto',
  'percentage',
  20,
  'all_plans',
  false,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NULL,
  1
);

-- Criar cupom DIAG15 para leads Potencial (15% desconto)
INSERT INTO public.coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  applies_to,
  is_public,
  status,
  start_date,
  end_date,
  max_uses,
  max_uses_per_user
) VALUES (
  'DIAG15',
  'Desconto Diagnóstico Potencial',
  'Cupom exclusivo para leads Potencial do diagnóstico - 15% de desconto',
  'percentage',
  15,
  'all_plans',
  false,
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NULL,
  1
);