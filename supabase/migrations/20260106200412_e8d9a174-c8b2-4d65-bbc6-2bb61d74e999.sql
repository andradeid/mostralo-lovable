-- Criar bucket para armazenamento temporário de áudios do diagnóstico
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diagnostic-audios',
  'diagnostic-audios',
  false,
  10485760, -- 10MB
  ARRAY['audio/mpeg', 'audio/mp3']
) ON CONFLICT (id) DO NOTHING;

-- Política para permitir que o service_role possa gerenciar os arquivos
CREATE POLICY "Service role can manage diagnostic audios"
ON storage.objects
FOR ALL
USING (bucket_id = 'diagnostic-audios')
WITH CHECK (bucket_id = 'diagnostic-audios');