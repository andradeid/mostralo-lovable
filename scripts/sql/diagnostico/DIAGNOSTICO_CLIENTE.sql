-- ============================================
-- DIAGNÓSTICO DE CLIENTE - TELEFONE 22222222222
-- ============================================

-- 1. Verificar se o cliente existe
SELECT 
  'CLIENTE ENCONTRADO!' AS status,
  id,
  name,
  phone,
  email,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '⚠️ SEM AUTH_USER_ID - PROBLEMA!'
    ELSE '✅ TEM AUTH_USER_ID'
  END AS auth_status,
  created_at
FROM customers
WHERE phone = '22222222222';

-- 2. Se não encontrou, tentar variações
SELECT 
  'VARIAÇÕES DE TELEFONE' AS status,
  id,
  name,
  phone,
  auth_user_id
FROM customers
WHERE phone LIKE '%22222%'
   OR phone LIKE '22222222222%'
   OR phone LIKE '%22222222222';

-- 3. Se tem auth_user_id, verificar o usuário Auth
SELECT 
  'DADOS DO USUÁRIO AUTH' AS status,
  u.id,
  u.email,
  u.confirmed_at,
  u.last_sign_in_at,
  u.banned_until,
  CASE 
    WHEN u.banned_until IS NOT NULL AND u.banned_until > NOW() 
    THEN '🚫 USUÁRIO BLOQUEADO TEMPORARIAMENTE!'
    ELSE '✅ NÃO BLOQUEADO'
  END AS ban_status
FROM auth.users u
WHERE u.id IN (
  SELECT auth_user_id 
  FROM customers 
  WHERE phone = '22222222222'
);

-- 4. Verificar roles do usuário
SELECT 
  'ROLES DO USUÁRIO' AS status,
  ur.role,
  ur.created_at
FROM user_roles ur
WHERE ur.user_id IN (
  SELECT auth_user_id 
  FROM customers 
  WHERE phone = '22222222222'
);

-- 5. Verificar últimas tentativas de login (se houver tabela de auditoria)
SELECT 
  'HISTÓRICO DE SEGURANÇA' AS status,
  action,
  timestamp,
  details
FROM security_audit_log
WHERE user_id IN (
  SELECT auth_user_id 
  FROM customers 
  WHERE phone = '22222222222'
)
ORDER BY timestamp DESC
LIMIT 10;

-- ============================================
-- SOLUÇÕES POSSÍVEIS
-- ============================================

-- SOLUÇÃO 1: Se cliente não existe, ele precisa se CADASTRAR primeiro
-- Use a aba "Criar conta" no diálogo de autenticação

-- SOLUÇÃO 2: Se existe mas sem auth_user_id, precisa RECRIAR o cliente
-- (Entre em contato com suporte técnico)

-- SOLUÇÃO 3: Se usuário está bloqueado temporariamente (rate limiting)
-- ESPERE 15-30 minutos antes de tentar novamente
-- OU execute o comando abaixo para desbloquear:

/*
UPDATE auth.users 
SET banned_until = NULL 
WHERE email = 'cliente_22222222222@temp.mostralo.com';
*/

-- SOLUÇÃO 4: Se esqueceu a senha, pode resetar manualmente:
-- (Você precisará criar uma nova senha manualmente no Auth)

