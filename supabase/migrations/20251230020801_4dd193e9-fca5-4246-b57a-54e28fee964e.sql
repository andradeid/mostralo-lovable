-- Permitir INSERT público em upsell_statistics
CREATE POLICY "Insercao publica de estatisticas upsell"
ON upsell_statistics FOR INSERT
TO public
WITH CHECK (true);

-- Permitir INSERT público em crosssell_statistics
CREATE POLICY "Insercao publica de estatisticas crosssell"
ON crosssell_statistics FOR INSERT
TO public
WITH CHECK (true);