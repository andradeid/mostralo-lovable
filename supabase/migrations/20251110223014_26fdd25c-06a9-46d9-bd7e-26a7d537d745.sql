-- Adicionar coluna phone na tabela profiles para delivery drivers
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Criar índice para performance (não único pois clientes não têm profile)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Migrar telefones existentes do user_metadata para profiles
-- Apenas para usuários que são delivery_drivers
UPDATE profiles p
SET phone = (
  SELECT u.raw_user_meta_data->>'phone'
  FROM auth.users u
  WHERE u.id = p.id 
    AND u.raw_user_meta_data->>'phone' IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = p.id 
    AND ur.role = 'delivery_driver'
)
AND phone IS NULL;