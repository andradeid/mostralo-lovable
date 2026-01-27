-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para leitura pública
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Política para upload via service role (edge functions)
CREATE POLICY "Upload de imagens via service role"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Política para atualização via service role
CREATE POLICY "Atualização de imagens via service role"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- Política para delete via service role
CREATE POLICY "Delete de imagens via service role"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');