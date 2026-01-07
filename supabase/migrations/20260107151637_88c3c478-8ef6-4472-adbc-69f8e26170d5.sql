-- Policy para store_admin fazer upload de fotos de pacientes
CREATE POLICY "Store admins podem fazer upload de fotos de pacientes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'patients'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('master_admin', 'store_admin')
  )
);

-- Policy para store_admin atualizar fotos de pacientes
CREATE POLICY "Store admins podem atualizar fotos de pacientes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'patients'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('master_admin', 'store_admin')
  )
);

-- Policy para store_admin deletar fotos de pacientes
CREATE POLICY "Store admins podem deletar fotos de pacientes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'patients'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('master_admin', 'store_admin')
  )
);