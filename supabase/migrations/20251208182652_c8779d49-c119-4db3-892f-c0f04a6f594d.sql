-- Permitir que store_admins e attendants leiam a tabela modules
-- Módulos são dados de referência que precisam ser visíveis para verificar permissões

CREATE POLICY "Authenticated users can view modules"
ON public.modules
FOR SELECT
USING (auth.uid() IS NOT NULL);