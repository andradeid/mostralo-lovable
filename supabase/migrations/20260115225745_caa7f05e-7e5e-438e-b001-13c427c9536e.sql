-- Adicionar role professional para hulkpro@email.com
INSERT INTO user_roles (user_id, role, store_id)
SELECT 
  '29f590b9-a619-446e-b0e3-d4974db023b0',
  'professional',
  '79fedd36-6e19-42d6-b331-79f9ad777180'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '29f590b9-a619-446e-b0e3-d4974db023b0' 
  AND role = 'professional'
);