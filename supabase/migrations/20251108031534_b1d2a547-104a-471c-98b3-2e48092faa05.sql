-- Remover role store_admin do cliente que estava causando redirecionamento incorreto
DELETE FROM user_roles 
WHERE id = 'b81c16fb-3d8b-44cf-917a-4a770249d637'
  AND user_id = 'f5d13822-2822-469f-bfc6-78a6655f143e'
  AND role = 'store_admin';