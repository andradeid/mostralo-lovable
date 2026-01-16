-- Adicionar coluna de anexo na tabela dental_payments
ALTER TABLE public.dental_payments ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Criar bucket para comprovantes de pagamentos odontológicos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dental-payment-receipts', 'dental-payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Allow authenticated users to upload dental payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dental-payment-receipts');

-- Política para permitir leitura pública
CREATE POLICY "Allow public read of dental payment receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dental-payment-receipts');

-- Política para permitir delete por usuários autenticados
CREATE POLICY "Allow authenticated users to delete dental payment receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dental-payment-receipts');

-- Política para permitir update por usuários autenticados
CREATE POLICY "Allow authenticated users to update dental payment receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dental-payment-receipts');