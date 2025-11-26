-- Correção de dados do usuário hulk@mostralo.app
-- Este usuário foi criado antes das correções de segurança e possui dados incorretos

-- 1. Corrigir user_type no perfil (deve ser NULL para delivery_driver)
UPDATE profiles
SET user_type = NULL
WHERE email = 'hulk@mostralo.app';

-- 2. Deletar role incorreta (store_admin sem store_id)
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM profiles WHERE email = 'hulk@mostralo.app')
  AND role = 'store_admin';

-- 3. Criar role delivery_driver correta vinculada à Stark Pizzaria
INSERT INTO user_roles (user_id, role, store_id)
VALUES (
  (SELECT id FROM profiles WHERE email = 'hulk@mostralo.app'),
  'delivery_driver',
  '79fedd36-6e19-42d6-b331-79f9ad777180' -- Stark Pizzaria
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Incrementar contador do link de convite usado
UPDATE store_invite_links
SET current_uses = current_uses + 1
WHERE token = 'b550cd7b-1463-4e78-92fe-a2cc5a0ec553';