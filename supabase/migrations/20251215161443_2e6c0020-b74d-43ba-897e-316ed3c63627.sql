-- Permitir que qualquer usuário (incluindo anônimos) 
-- busque vendedores ativos pelo referral_code para validação durante cadastro
CREATE POLICY "public_validate_referral_code"
ON salespeople
FOR SELECT
USING (
  status = 'active' 
  AND referral_code IS NOT NULL
);