-- Política para permitir verificação pública de contratos por hash
CREATE POLICY "Permite verificação pública por hash"
ON salesperson_contracts
FOR SELECT
TO public
USING (verification_hash IS NOT NULL);