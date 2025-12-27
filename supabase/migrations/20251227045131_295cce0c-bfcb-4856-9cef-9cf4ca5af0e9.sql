-- Criar bucket stores (usado pelo totem e outras funcionalidades)
INSERT INTO storage.buckets (id, name, public)
VALUES ('stores', 'stores', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública
CREATE POLICY "Stores bucket is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'stores');

-- Política para upload por usuários autenticados
CREATE POLICY "Authenticated users can upload to stores bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stores' AND auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
CREATE POLICY "Authenticated users can update stores bucket files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stores' AND auth.role() = 'authenticated');

-- Política para exclusão por usuários autenticados  
CREATE POLICY "Authenticated users can delete stores bucket files"
ON storage.objects FOR DELETE
USING (bucket_id = 'stores' AND auth.role() = 'authenticated');