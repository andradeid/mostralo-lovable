-- Adicionar coluna image_url na tabela sentinela_templates
ALTER TABLE sentinela_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adicionar colunas na tabela sentinela_rules
ALTER TABLE sentinela_rules ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE sentinela_rules ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES sentinela_templates(id);

-- Criar bucket para imagens do sentinela
INSERT INTO storage.buckets (id, name, public)
VALUES ('sentinela-images', 'sentinela-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload de imagens
CREATE POLICY "Authenticated users can upload sentinela images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sentinela-images');

-- Policy para visualização pública
CREATE POLICY "Sentinela images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sentinela-images');

-- Policy para deletar imagens
CREATE POLICY "Authenticated users can delete sentinela images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sentinela-images');

-- Policy para atualizar imagens
CREATE POLICY "Authenticated users can update sentinela images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sentinela-images');