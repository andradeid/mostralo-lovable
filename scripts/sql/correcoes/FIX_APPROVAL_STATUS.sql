-- ========================================
-- CORREÇÃO DEFINITIVA - APPROVAL_STATUS
-- Usuário: ingabeachsports@gmail.com
-- ========================================

-- PASSO 1: DIAGNÓSTICO COMPLETO
-- ========================================

-- Verificar TUDO sobre o usuário
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.user_type,
  p.approval_status, -- ❌ ESTE É O PROBLEMA!
  p.created_at,
  s.id as store_id,
  s.name as store_name,
  s.plan_id,
  s.subscription_expires_at,
  s.status as store_status,
  pl.name as plan_name,
  pl.price as plan_price
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'ingabeachsports@gmail.com';

-- ========================================
-- PROBLEMA IDENTIFICADO
-- ========================================
/*
O sistema tem DUAS verificações:

1. ASSINATURA (subscription_expires_at)
   - Verifica se o plano está ativo
   - Verifica se não expirou
   
2. APROVAÇÃO (approval_status) ❌ PROBLEMA AQUI!
   - Se approval_status = 'pending' → BLOQUEIA
   - Se approval_status = 'rejected' → BLOQUEIA
   - Só libera se approval_status = 'approved'

FLUXO DO SISTEMA:
1. Usuário se cadastra → approval_status = 'pending'
2. Usuário envia comprovante de pagamento
3. Super admin aprova o pagamento
4. Sistema muda approval_status para 'approved' ✅

SE O SUPER ADMIN NÃO APROVOU O PAGAMENTO:
- approval_status fica 'pending'
- Usuário fica bloqueado INDEPENDENTE da assinatura
- Menu mostra apenas "Minha Assinatura"
*/

-- ========================================
-- PASSO 2: CORREÇÃO IMEDIATA
-- ========================================

-- OPÇÃO 1: APROVAR O USUÁRIO MANUALMENTE
-- Esta é a MELHOR opção se você é o super admin
UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE email = 'ingabeachsports@gmail.com';

-- ========================================
-- PASSO 3: VERIFICAR CORREÇÃO
-- ========================================

-- Verificar se foi corrigido
SELECT 
  email,
  full_name,
  user_type,
  approval_status, -- Deve ser 'approved' agora
  created_at
FROM profiles
WHERE email = 'ingabeachsports@gmail.com';

-- ========================================
-- PASSO 4: VERIFICAR OUTROS USUÁRIOS
-- ========================================

-- Buscar TODOS os usuários bloqueados por approval_status
SELECT 
  p.email,
  p.full_name,
  p.approval_status,
  s.name as store_name,
  s.status as store_status,
  pl.name as plan_name,
  s.subscription_expires_at
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE 
  p.user_type = 'store_admin'
  AND p.approval_status IN ('pending', 'rejected')
ORDER BY p.created_at DESC;

-- ========================================
-- CORREÇÃO EM MASSA (CUIDADO!)
-- ========================================
/*
-- Uncommente APENAS se quiser aprovar TODOS os usuários pendentes
-- ATENÇÃO: Isso pode não ser desejado se você quer revisar pagamentos primeiro!

UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE 
  user_type = 'store_admin'
  AND approval_status = 'pending'
  AND id IN (
    SELECT owner_id 
    FROM stores 
    WHERE plan_id IS NOT NULL 
    AND status = 'active'
  );
*/

-- ========================================
-- VERIFICAÇÃO FINAL COMPLETA
-- ========================================

-- Verificar TUDO após correção
SELECT 
  'PERFIL' as tipo,
  p.email,
  p.approval_status as status,
  CASE 
    WHEN p.approval_status = 'approved' THEN '✅ APROVADO'
    WHEN p.approval_status = 'pending' THEN '⏳ PENDENTE - BLOQUEADO'
    WHEN p.approval_status = 'rejected' THEN '❌ REJEITADO - BLOQUEADO'
    ELSE '⚠️ INDEFINIDO'
  END as situacao_perfil
FROM profiles p
WHERE p.email = 'ingabeachsports@gmail.com'

UNION ALL

SELECT 
  'ASSINATURA' as tipo,
  p.email,
  s.status as status,
  CASE 
    WHEN s.subscription_expires_at IS NULL AND s.plan_id IS NOT NULL AND s.status = 'active' 
      THEN '✅ ATIVO (ILIMITADO)'
    WHEN s.subscription_expires_at > NOW() AND s.status = 'active' 
      THEN '✅ ATIVO (EXPIRA: ' || TO_CHAR(s.subscription_expires_at, 'DD/MM/YYYY') || ')'
    WHEN s.subscription_expires_at < NOW() 
      THEN '❌ EXPIRADO'
    WHEN s.status = 'inactive' 
      THEN '❌ INATIVO'
    ELSE '⚠️ INDEFINIDO'
  END as situacao_assinatura
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
WHERE p.email = 'ingabeachsports@gmail.com';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
/*
Após executar a OPÇÃO 1, o resultado deve ser:

PERFIL:
- approval_status: 'approved' ✅
- Situação: ✅ APROVADO

ASSINATURA:
- status: 'active' ✅
- subscription_expires_at: 31/12/2026 (ou futuro) ✅
- Situação: ✅ ATIVO

ACESSO:
- Menu completo liberado ✅
- Todas as funcionalidades disponíveis ✅
- Não redireciona mais para /dashboard/subscription ✅
*/

-- ========================================
-- ENTENDENDO O FLUXO COMPLETO
-- ========================================
/*
CADASTRO NORMAL:
1. Usuário cria conta em /signup
2. Sistema cria profile com approval_status = 'pending'
3. Usuário vai para /payment-proof
4. Usuário faz upload do comprovante
5. Sistema cria registro em payment_approvals
6. Super admin acessa /dashboard/subscription-payments
7. Super admin aprova o pagamento
8. Função approve_payment() no banco:
   - Muda approval_status para 'approved' ✅
   - Define subscription_expires_at
   - Muda store.status para 'active'
9. Usuário é liberado ✅

PROBLEMA:
- Se o passo 7 não foi feito (super admin não aprovou)
- approval_status fica 'pending'
- Usuário fica bloqueado SEMPRE

SOLUÇÃO:
- Executar este SQL para aprovar manualmente
- OU usar a interface em /dashboard/subscription-payments
*/

