-- ========================================
-- DIAGNÓSTICO E CORREÇÃO - ASSINATURA BLOQUEADA
-- Usuário: ingabeachsports@gmail.com
-- ========================================

-- PASSO 1: VERIFICAR ESTADO ATUAL DO USUÁRIO
-- ========================================

-- Buscar perfil do usuário
SELECT 
  id,
  email,
  full_name,
  user_type,
  approval_status,
  created_at
FROM profiles 
WHERE email = 'ingabeachsports@gmail.com';

-- Buscar loja do usuário
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.owner_id,
  s.plan_id,
  s.subscription_expires_at,
  s.status as store_status,
  s.created_at,
  p.name as plan_name,
  p.price as plan_price,
  p.billing_cycle
FROM stores s
LEFT JOIN profiles pr ON s.owner_id = pr.id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE pr.email = 'ingabeachsports@gmail.com';

-- ========================================
-- DIAGNÓSTICO: O PROBLEMA
-- ========================================
/*
PROBLEMA IDENTIFICADO:
- O usuário tem plan_id definido (Premium)
- O usuário tem store.status = 'active'
- MAS subscription_expires_at está NULL ❌

COMO O SISTEMA VERIFICA:
1. AdminSidebar.tsx (linha 87-109):
   - Se subscription_expires_at é NULL, status fica 'active'
   - MAS a lógica considera que sem data = problema!
   
2. AdminSidebar.tsx (linha 168):
   - isSubscriptionInactive = planInfo?.status === 'expired' || storeConfig?.status === 'inactive'
   - Se não tem data de expiração, o sistema não sabe quando expirar
   
3. A página de assinatura mostra "Sem Plano" porque:
   - A query não consegue buscar o plano OU
   - O plano não está sendo retornado corretamente
*/

-- ========================================
-- PASSO 2: CORREÇÃO
-- ========================================

-- OPÇÃO 1: DEFINIR DATA DE EXPIRAÇÃO COMO ILIMITADA (1 ano no futuro)
-- Esta é a MELHOR opção para não quebrar nada
UPDATE stores
SET 
  subscription_expires_at = (CURRENT_DATE + INTERVAL '1 year')::timestamp,
  status = 'active',
  updated_at = NOW()
WHERE owner_id = (
  SELECT id FROM profiles WHERE email = 'ingabeachsports@gmail.com'
);

-- OPÇÃO 2: DEFINIR COMO PLANO VITALÍCIO (10 anos)
-- Uncommente se quiser que seja praticamente ilimitado
/*
UPDATE stores
SET 
  subscription_expires_at = (CURRENT_DATE + INTERVAL '10 years')::timestamp,
  status = 'active',
  updated_at = NOW()
WHERE owner_id = (
  SELECT id FROM profiles WHERE email = 'ingabeachsports@gmail.com'
);
*/

-- ========================================
-- PASSO 3: VERIFICAR CORREÇÃO
-- ========================================

-- Verificar se a correção foi aplicada
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.owner_id,
  s.plan_id,
  s.subscription_expires_at,
  s.status as store_status,
  p.name as plan_name,
  p.price as plan_price,
  -- Calcular dias até expirar
  EXTRACT(DAY FROM (s.subscription_expires_at - NOW())) as days_until_expiration,
  -- Verificar se está expirado
  CASE 
    WHEN s.subscription_expires_at IS NULL THEN 'SEM DATA'
    WHEN s.subscription_expires_at < NOW() THEN 'EXPIRADO'
    WHEN EXTRACT(DAY FROM (s.subscription_expires_at - NOW())) <= 30 THEN 'EXPIRANDO EM BREVE'
    ELSE 'ATIVO'
  END as subscription_status
FROM stores s
LEFT JOIN profiles pr ON s.owner_id = pr.id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE pr.email = 'ingabeachsports@gmail.com';

-- ========================================
-- BONUS: VERIFICAR TODOS OS USUÁRIOS COM PROBLEMA SIMILAR
-- ========================================

-- Buscar todos os usuários com plano mas sem data de expiração
SELECT 
  pr.email,
  pr.full_name,
  s.name as store_name,
  s.plan_id,
  s.subscription_expires_at,
  s.status as store_status,
  p.name as plan_name
FROM stores s
INNER JOIN profiles pr ON s.owner_id = pr.id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE 
  s.plan_id IS NOT NULL 
  AND s.subscription_expires_at IS NULL
  AND s.status = 'active'
ORDER BY pr.email;

-- ========================================
-- CORREÇÃO EM MASSA (CUIDADO!)
-- ========================================
/*
-- Uncommente APENAS se quiser corrigir TODOS os usuários com esse problema
UPDATE stores
SET 
  subscription_expires_at = (CURRENT_DATE + INTERVAL '1 year')::timestamp,
  updated_at = NOW()
WHERE 
  plan_id IS NOT NULL 
  AND subscription_expires_at IS NULL
  AND status = 'active';
*/

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
/*
Após executar a OPÇÃO 1, o usuário terá:
- plan_id: Premium (inalterado)
- subscription_expires_at: 2025-11-24 (1 ano no futuro)
- status: 'active' (confirmado)

O sistema então calculará:
- days_until_expiration: ~365 dias
- status: 'active' (não é 'expired' nem 'expiring')

AdminSidebar.tsx:
- planInfo.status será 'active'
- isSubscriptionInactive será FALSE
- Menu completo será exibido ✅

SubscriptionPage.tsx:
- Mostrará "Plano Premium"
- Mostrará "Expira em: 24/11/2026"
- Status: "Ativo" ✅
*/

