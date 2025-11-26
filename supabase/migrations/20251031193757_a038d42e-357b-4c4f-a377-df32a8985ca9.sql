-- Adicionar policy para store owners atualizarem perfis dos seus entregadores
CREATE POLICY "Store owners can update their delivery drivers profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (public.is_store_owner_of_driver(profiles.id))
WITH CHECK (public.is_store_owner_of_driver(profiles.id));

-- Adicionar policy para store owners removerem roles de entregadores
CREATE POLICY "Store owners can delete delivery driver roles"
ON user_roles
FOR DELETE
TO authenticated
USING (
  role = 'delivery_driver' AND 
  public.is_store_owner_of_driver(user_id)
);