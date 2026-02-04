-- Redefinir senha do vendedor solucoesobjrtiva@gmail.com
UPDATE auth.users
SET 
  encrypted_password = crypt('120143', gen_salt('bf')),
  confirmation_token = '',
  updated_at = now()
WHERE id = '4e3f56ba-d976-43d5-b45a-daeccc31395e';