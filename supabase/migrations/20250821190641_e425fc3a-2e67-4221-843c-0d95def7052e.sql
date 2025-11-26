-- Adicionar avatar_url à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar bucket para avatars dos usuários se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket avatars
CREATE POLICY "Avatars são publicamente acessíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seus próprios avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar seus próprios avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seus próprios avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins podem gerenciar todos os avatars
CREATE POLICY "Admins podem gerenciar todos os avatars" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'avatars' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'master_admin'))
);