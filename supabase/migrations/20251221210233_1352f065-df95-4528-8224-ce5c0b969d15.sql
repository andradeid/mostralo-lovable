-- ===============================================
-- Módulo: Painel Digital (Digital Signage)
-- ===============================================

-- Tabela para itens de mídia do painel digital
CREATE TABLE public.store_signage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image', -- 'image' ou 'video'
  duration_seconds INTEGER NOT NULL DEFAULT 10,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para configurações do painel
CREATE TABLE public.store_signage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  transition_type TEXT NOT NULL DEFAULT 'fade', -- 'fade', 'slide', 'none'
  transition_duration_ms INTEGER NOT NULL DEFAULT 500,
  show_clock BOOLEAN NOT NULL DEFAULT false,
  background_color TEXT NOT NULL DEFAULT '#000000',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_signage_items_store ON public.store_signage_items(store_id);
CREATE INDEX idx_signage_items_active ON public.store_signage_items(store_id, is_active);
CREATE INDEX idx_signage_items_order ON public.store_signage_items(store_id, sort_order);

-- Habilitar RLS
ALTER TABLE public.store_signage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_signage_config ENABLE ROW LEVEL SECURITY;

-- Políticas para store_signage_items
CREATE POLICY "Store owner can manage signage items" 
ON public.store_signage_items 
FOR ALL 
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view active signage items" 
ON public.store_signage_items 
FOR SELECT 
USING (is_active = true);

-- Políticas para store_signage_config
CREATE POLICY "Store owner can manage signage config" 
ON public.store_signage_config 
FOR ALL 
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view enabled signage config" 
ON public.store_signage_config 
FOR SELECT 
USING (is_enabled = true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_signage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_store_signage_items_updated_at
  BEFORE UPDATE ON public.store_signage_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_signage_updated_at();

CREATE TRIGGER update_store_signage_config_updated_at
  BEFORE UPDATE ON public.store_signage_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_signage_updated_at();

-- Criar bucket para mídias do painel digital
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signage-media',
  'signage-media',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Políticas de storage para signage-media
CREATE POLICY "Signage media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'signage-media');

CREATE POLICY "Store owners can upload signage media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signage-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Store owners can update their signage media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signage-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Store owners can delete their signage media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signage-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);