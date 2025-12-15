-- Permitir que usuários anônimos visualizem templates de contrato ativos
-- Necessário para o processo de cadastro de vendedores
CREATE POLICY "Public can view active contract templates for signup"
ON salesperson_contract_templates
FOR SELECT
TO anon, authenticated
USING (is_active = true);