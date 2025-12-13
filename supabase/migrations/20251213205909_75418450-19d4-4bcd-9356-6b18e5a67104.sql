-- Adicionar colunas de qualificação na tabela salespeople
ALTER TABLE public.salespeople
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS qualification_answers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS qualification_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualification_level text DEFAULT 'evaluation';

-- Criar storage bucket para fotos de vendedores
INSERT INTO storage.buckets (id, name, public)
VALUES ('salesperson-photos', 'salesperson-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de fotos (usuários autenticados podem fazer upload)
CREATE POLICY "Anyone can upload salesperson photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'salesperson-photos');

-- Política para visualização pública das fotos
CREATE POLICY "Salesperson photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'salesperson-photos');

-- Política para atualização (usuários autenticados)
CREATE POLICY "Anyone can update salesperson photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'salesperson-photos');

-- Política para deleção (usuários autenticados)
CREATE POLICY "Anyone can delete salesperson photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'salesperson-photos');