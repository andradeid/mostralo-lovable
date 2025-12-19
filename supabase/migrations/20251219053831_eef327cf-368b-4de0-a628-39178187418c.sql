-- Adicionar política de leitura pública para plan_modules
-- Isso permite que visitantes da landing page vejam os módulos de cada plano
CREATE POLICY "Anyone can view plan modules"
ON public.plan_modules
FOR SELECT
TO public
USING (true);