-- Adiciona campos de latitude e longitude na tabela stores
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Adiciona comentário explicativo
COMMENT ON COLUMN public.stores.latitude IS 'Coordenada de latitude da localização do estabelecimento';
COMMENT ON COLUMN public.stores.longitude IS 'Coordenada de longitude da localização do estabelecimento';