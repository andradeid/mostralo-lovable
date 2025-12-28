-- Criar bucket para imagens de serviços de agendamento
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('booking-service-images', 'booking-service-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Política para usuários autenticados fazerem upload
CREATE POLICY "Allow authenticated upload to booking-service-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'booking-service-images');

-- Política para leitura pública
CREATE POLICY "Allow public read of booking-service-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'booking-service-images');

-- Política para deleção por usuários autenticados
CREATE POLICY "Allow authenticated delete from booking-service-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'booking-service-images');