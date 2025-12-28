-- Criar bucket para fotos de profissionais
INSERT INTO storage.buckets (id, name, public)
VALUES ('professional-photos', 'professional-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública das fotos
CREATE POLICY "Professional photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'professional-photos');

-- Política para upload por usuários autenticados (donos de loja)
CREATE POLICY "Store owners can upload professional photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'professional-photos' 
  AND auth.role() = 'authenticated'
);

-- Política para atualização por usuários autenticados
CREATE POLICY "Store owners can update professional photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'professional-photos' 
  AND auth.role() = 'authenticated'
);

-- Política para deleção por usuários autenticados
CREATE POLICY "Store owners can delete professional photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'professional-photos' 
  AND auth.role() = 'authenticated'
);