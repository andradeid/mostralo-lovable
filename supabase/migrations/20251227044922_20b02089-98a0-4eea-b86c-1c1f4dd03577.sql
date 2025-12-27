-- Criar bucket para imagens do totem
INSERT INTO storage.buckets (id, name, public)
VALUES ('totem-images', 'totem-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública
CREATE POLICY "Totem images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'totem-images');

-- Política para upload por usuários autenticados
CREATE POLICY "Authenticated users can upload totem images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'totem-images' AND auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
CREATE POLICY "Authenticated users can update totem images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'totem-images' AND auth.role() = 'authenticated');

-- Política para exclusão por usuários autenticados
CREATE POLICY "Authenticated users can delete totem images"
ON storage.objects FOR DELETE
USING (bucket_id = 'totem-images' AND auth.role() = 'authenticated');