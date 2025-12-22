-- Remover policy duplicada de acesso público
DROP POLICY IF EXISTS "Public signage access to active stores" ON stores;

-- Garantir que a policy pública restante está correta
-- A policy "Public can view active stores for XML/JSON API" já cobre o caso