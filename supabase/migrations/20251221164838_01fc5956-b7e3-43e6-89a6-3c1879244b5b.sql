-- Criar bucket para mídias de campanhas WhatsApp
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer pessoa pode ver mídias de campanhas (público)
CREATE POLICY "campaign_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-media');

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "campaign_media_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-media' AND
  auth.role() = 'authenticated'
);

-- Política: Usuários autenticados podem atualizar seus uploads
CREATE POLICY "campaign_media_authenticated_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-media' AND
  auth.role() = 'authenticated'
);

-- Política: Usuários autenticados podem deletar
CREATE POLICY "campaign_media_authenticated_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-media' AND
  auth.role() = 'authenticated'
);

-- Adicionar colunas na tabela whatsapp_campaigns
ALTER TABLE whatsapp_campaigns
ADD COLUMN IF NOT EXISTS custom_message TEXT,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;