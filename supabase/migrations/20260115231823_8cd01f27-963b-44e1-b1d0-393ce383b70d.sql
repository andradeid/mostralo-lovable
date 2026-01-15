-- Corrigir usuários profissionais que foram criados com user_type errado
-- Atualizar profiles onde existe uma role 'professional' em user_roles

UPDATE profiles p
SET 
  user_type = 'professional',
  approval_status = 'approved'
FROM user_roles ur
WHERE ur.user_id = p.id 
  AND ur.role = 'professional'
  AND (p.user_type != 'professional' OR p.user_type IS NULL);

-- Corrigir especificamente os usuários mencionados
UPDATE profiles
SET user_type = 'professional', approval_status = 'approved'
WHERE email IN ('mulheraranhapro@email.com', 'aranhapro@email.com');

-- Corrigir a role do mulheraranhapro que ficou como store_admin
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'mulheraranhapro@email.com')
  AND role = 'store_admin';

INSERT INTO user_roles (user_id, role, store_id)
SELECT 
  p.id,
  'professional',
  prof.store_id
FROM profiles p
JOIN professionals prof ON prof.user_id = p.id
WHERE p.email = 'mulheraranhapro@email.com'
ON CONFLICT (user_id, role) DO NOTHING;