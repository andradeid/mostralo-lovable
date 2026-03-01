-- Criar bucket para mídia do chat WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp-chat-media', 'whatsapp-chat-media', true, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Política para upload autenticado
CREATE POLICY "Authenticated users can upload whatsapp media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-chat-media' AND auth.role() = 'authenticated');

-- Política para leitura pública
CREATE POLICY "Public read whatsapp chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-chat-media');

-- Política para delete autenticado
CREATE POLICY "Authenticated users can delete whatsapp media"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-chat-media' AND auth.role() = 'authenticated');