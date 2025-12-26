-- Corrigir RLS da store_table_service_config usando has_role() (boas práticas)

-- Remover policies antigas que usam subqueries diretas
DROP POLICY IF EXISTS "Store admins can view their config" ON store_table_service_config;
DROP POLICY IF EXISTS "Store admins can insert their config" ON store_table_service_config;
DROP POLICY IF EXISTS "Store admins can update their config" ON store_table_service_config;

-- Recriar policies usando funções SECURITY DEFINER (boas práticas)
CREATE POLICY "Store admins can view their config" ON store_table_service_config
  FOR SELECT USING (
    is_store_owner_direct(store_id, auth.uid())
    OR has_role(auth.uid(), 'master_admin'::app_role)
  );

CREATE POLICY "Store admins can insert their config" ON store_table_service_config
  FOR INSERT WITH CHECK (
    is_store_owner_direct(store_id, auth.uid())
    OR has_role(auth.uid(), 'master_admin'::app_role)
  );

CREATE POLICY "Store admins can update their config" ON store_table_service_config
  FOR UPDATE USING (
    is_store_owner_direct(store_id, auth.uid())
    OR has_role(auth.uid(), 'master_admin'::app_role)
  );