-- Adicionar coluna google_maps_link à tabela stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS google_maps_link TEXT;