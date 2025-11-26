-- ========================================
-- RESET SENHA SUPER ADMIN - URGENTE
-- ========================================
-- Email: admin@mostralo.com
-- Nova Senha: rA6HERzPkGUcyKgS
-- Data: 2025-11-25
-- ========================================

-- Resetar senha do super admin
UPDATE auth.users
SET 
  encrypted_password = crypt('rA6HERzPkGUcyKgS', gen_salt('bf')),
  updated_at = now()
WHERE email = 'admin@mostralo.com';

-- Verificar se foi atualizado
SELECT 
  id,
  email,
  updated_at,
  'Senha atualizada com sucesso!' as status
FROM auth.users
WHERE email = 'admin@mostralo.com';

