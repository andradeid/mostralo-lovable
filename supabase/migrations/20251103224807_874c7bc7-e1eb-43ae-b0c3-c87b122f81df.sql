-- 1. Tornar o bucket subscription-receipts público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'subscription-receipts';

-- 2. Criar políticas RLS para o storage

-- Permitir lojistas fazerem upload de seus próprios comprovantes
CREATE POLICY "Store owners can upload their receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'subscription-receipts' 
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text
    FROM stores s
    WHERE s.owner_id = auth.uid()
  )
);

-- Permitir lojistas verem seus próprios comprovantes
CREATE POLICY "Store owners can view their receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'subscription-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text
    FROM stores s
    WHERE s.owner_id = auth.uid()
  )
);

-- Permitir master admins verem todos os comprovantes
CREATE POLICY "Master admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'subscription-receipts'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'master_admin'
  )
);

-- Permitir master admins gerenciarem todos os comprovantes
CREATE POLICY "Master admins can manage all receipts"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'subscription-receipts'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'master_admin'
  )
);