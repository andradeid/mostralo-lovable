-- Adicionar coluna has_audio para controlar som dos vídeos
ALTER TABLE store_signage_items 
ADD COLUMN has_audio BOOLEAN DEFAULT false;

-- Comentário para documentação
COMMENT ON COLUMN store_signage_items.has_audio IS 'Indica se o vídeo deve reproduzir com áudio habilitado';