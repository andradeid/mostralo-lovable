-- Criar bucket para imagens de produtos se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-images', 'store-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket store-images
CREATE POLICY "Todos podem visualizar imagens de lojas" ON storage.objects
FOR SELECT USING (bucket_id = 'store-images');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Proprietários podem atualizar suas imagens" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Proprietários podem deletar suas imagens" ON storage.objects
FOR DELETE USING (
  bucket_id = 'store-images' 
  AND auth.uid() IS NOT NULL
);