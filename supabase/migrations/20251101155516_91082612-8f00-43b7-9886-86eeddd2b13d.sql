-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar coluna para armazenar URL do comprovante
ALTER TABLE driver_earnings 
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;

-- Políticas RLS para o bucket payment-receipts

-- Lojistas podem fazer upload de comprovantes para suas lojas
CREATE POLICY "Store owners can upload payment receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- Lojistas podem visualizar comprovantes dos seus entregadores
CREATE POLICY "Store owners can view their payment receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- Entregadores podem visualizar seus próprios comprovantes
CREATE POLICY "Drivers can view their own payment receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Master admins podem visualizar todos os comprovantes
CREATE POLICY "Master admins can view all payment receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND user_type = 'master_admin'
  )
);

-- Lojistas podem atualizar comprovantes da sua loja
CREATE POLICY "Store owners can update their payment receipts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);

-- Lojistas podem deletar comprovantes da sua loja
CREATE POLICY "Store owners can delete their payment receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-receipts' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stores WHERE owner_id = auth.uid()
  )
);