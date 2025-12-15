-- Política RLS para permitir verificação pública de contratos de lojistas por hash
CREATE POLICY "Permite verificação pública por hash" 
ON merchant_contract_acceptance
FOR SELECT
TO anon, authenticated
USING (verification_hash IS NOT NULL);