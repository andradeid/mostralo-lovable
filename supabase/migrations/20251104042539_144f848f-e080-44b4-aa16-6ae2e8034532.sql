-- Redefinir senha do cliente Marcos Andrade para 102030
UPDATE auth.users
SET 
  encrypted_password = crypt('102030', gen_salt('bf')),
  updated_at = now()
WHERE id = 'f5d13822-2822-469f-bfc6-78a6655f143e';
