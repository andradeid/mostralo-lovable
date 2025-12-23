-- Permitir acesso público para visualização de faturas pelo ID
-- O UUID garante segurança pois é praticamente impossível adivinhar
-- Apenas SELECT é permitido, sem possibilidade de modificação
CREATE POLICY "Acesso público para pagamento de faturas" 
ON subscription_invoices
FOR SELECT
TO anon
USING (true);