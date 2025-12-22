-- Policy específica para acesso público ao painel de sinalização
-- Garante que usuários anônimos possam ver lojas ativas pelo slug
CREATE POLICY "Public signage access to active stores"
ON stores
FOR SELECT
TO anon
USING (status = 'active'::store_status);