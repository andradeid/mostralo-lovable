-- =============================================
-- CRIAR CUPOM DE TESTE PARA BANNER PROMOCIONAL
-- =============================================

-- Este script cria um cupom público que aparecerá
-- automaticamente no banner da home

INSERT INTO public.coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    applies_to,
    max_uses,
    max_uses_per_user,
    start_date,
    end_date,
    status,
    is_public,
    promotion_label,
    show_countdown
)
VALUES (
    'BLACK90',                                      -- Código do cupom
    'Black Friday Especial',                        -- Nome da promoção
    'Desconto imperdível para novos assinantes',   -- Descrição
    'percentage',                                   -- Tipo: 'percentage' ou 'fixed'
    90,                                            -- Valor: 90% OFF
    'all',                                         -- Aplica a: 'all' ou 'specific'
    100,                                           -- Máximo 100 usos
    1,                                             -- 1 uso por usuário
    now(),                                         -- Data início: AGORA
    now() + INTERVAL '30 days',                    -- Data fim: +30 dias
    'active',                                      -- Status: 'active'
    true,                                          -- ⚠️ PÚBLICO: true (aparece na home)
    'OFERTA ESPECIAL',                             -- Label da promoção
    true                                           -- ⚠️ MOSTRAR CONTADOR: true
);

-- =============================================
-- VERIFICAR SE FOI CRIADO
-- =============================================

SELECT 
    code,
    name,
    discount_type,
    discount_value,
    is_public,
    show_countdown,
    status,
    start_date,
    end_date
FROM public.coupons
WHERE code = 'BLACK90';

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- 
-- code:            BLACK90
-- name:            Black Friday Especial
-- discount_type:   percentage
-- discount_value:  90
-- is_public:       true  ✅ (aparece na home)
-- show_countdown:  true  ✅ (mostra contador)
-- status:          active ✅
-- start_date:      2025-11-25... (data atual)
-- end_date:        2025-12-25... (+30 dias)
--
-- =============================================

-- =============================================
-- COMO TESTAR
-- =============================================
--
-- 1. Execute este script no Supabase SQL Editor
-- 2. Acesse: http://localhost:5173
-- 3. Recarregue: Ctrl + Shift + R
-- 4. Veja o banner logo abaixo do header
--
-- =============================================

-- =============================================
-- EXEMPLOS DE OUTROS CUPONS
-- =============================================

-- Cupom de valor fixo (R$ 50 OFF)
/*
INSERT INTO public.coupons (
    code, name, description, discount_type, discount_value,
    applies_to, max_uses, max_uses_per_user,
    start_date, end_date, status, is_public, promotion_label, show_countdown
)
VALUES (
    'BEMVINDO50', 'Boas-vindas', 'R$ 50 OFF na primeira assinatura',
    'fixed', 50, 'all', NULL, 1,
    now(), now() + INTERVAL '90 days',
    'active', true, 'NOVO CLIENTE', true
);
*/

-- Cupom sem limite de usos
/*
INSERT INTO public.coupons (
    code, name, description, discount_type, discount_value,
    applies_to, max_uses, max_uses_per_user,
    start_date, end_date, status, is_public, promotion_label, show_countdown
)
VALUES (
    'NATAL25', 'Natal 2025', '25% OFF em qualquer plano',
    'percentage', 25, 'all', NULL, 1,
    '2025-12-01 00:00:00+00', '2025-12-25 23:59:59+00',
    'active', true, 'NATAL 2025', true
);
*/

-- =============================================
-- CAMPOS IMPORTANTES
-- =============================================
--
-- is_public = true   →  Aparece no banner da home
-- show_countdown     →  Exibe contador regressivo
-- status = 'active'  →  Cupom ativo
-- start_date <= hoje →  Promoção já iniciou
-- end_date >= hoje   →  Promoção ainda válida
--
-- =============================================

-- =============================================
-- DELETAR CUPOM DE TESTE (se necessário)
-- =============================================

-- DELETE FROM public.coupons WHERE code = 'BLACK90';

