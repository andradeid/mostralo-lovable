-- Corrigir email do vendedor de solucoesobjrtiva para solucoesobjetiva
UPDATE auth.users
SET 
  email = 'solucoesobjetiva@gmail.com',
  updated_at = now()
WHERE id = '4e3f56ba-d976-43d5-b45a-daeccc31395e';