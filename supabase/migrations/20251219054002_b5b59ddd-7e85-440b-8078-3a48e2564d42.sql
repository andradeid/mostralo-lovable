-- Adicionar política de leitura pública para modules
-- Necessário porque a query de plan_modules faz join com modules
CREATE POLICY "Anyone can view modules"
ON public.modules
FOR SELECT
TO public
USING (true);