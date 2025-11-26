-- ========================================
-- CORREÇÃO IMEDIATA - ingabeachsports@gmail.com
-- ========================================

-- PASSO 1: VERIFICAR ESTADO ATUAL
SELECT 
  p.email,
  p.full_name,
  p.user_type,
  p.approval_status, -- Deve estar 'pending'
  s.name as store_name,
  s.status as store_status,
  s.plan_id,
  s.subscription_expires_at,
  pl.name as plan_name
FROM profiles p
LEFT JOIN stores s ON s.owner_id = p.id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.email = 'ingabeachsports@gmail.com';

-- PASSO 2: CORRIGIR approval_status
UPDATE profiles
SET 
  approval_status = 'approved',
  updated_at = NOW()
WHERE email = 'ingabeachsports@gmail.com';

-- PASSO 3: VERIFICAR CORREÇÃO
SELECT 
  email,
  full_name,
  approval_status, -- Agora deve ser 'approved' ✅
  user_type,
  '✅ CORRIGIDO!' as resultado
FROM profiles
WHERE email = 'ingabeachsports@gmail.com';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
/*
Email: ingabeachsports@gmail.com
Full Name: Matheus Gontijo
approval_status: approved ✅
user_type: store_admin
resultado: ✅ CORRIGIDO!

PRÓXIMO PASSO:
1. Usuário deve fazer logout
2. Fazer login novamente
3. Menu completo deve aparecer
4. Funcionalidades desbloqueadas!
*/

