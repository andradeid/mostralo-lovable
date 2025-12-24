-- ========================================
-- MUDANÇA DE EMAIL DO SUPER ADMIN
-- ========================================
-- Email Antigo: admin@mostralo.com
-- Email Novo: marcos@setupdigital.com.br
-- Senha: rA6HERzPkGUcyKgS (mantida)
-- Data: 2025-11-25 02:22:47 UTC
-- ========================================

-- SQL executado:
UPDATE auth.users
SET 
  email = 'marcos@setupdigital.com.br',
  updated_at = now()
WHERE email = 'admin@mostralo.com'
RETURNING id, email, updated_at;

-- Resultado:
-- ID: 4bfe6a27-178c-4110-8338-770a34c6c2ef
-- Email: marcos@setupdigital.com.br
-- Status: ✅ ATUALIZADO COM SUCESSO

-- ========================================
-- VERIFICAR
-- ========================================

-- Para verificar o email atual:
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'marcos@setupdigital.com.br';

-- ========================================

