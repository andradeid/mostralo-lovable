-- Tabela principal de atualizações do sistema
CREATE TABLE public.system_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('feature', 'fix', 'improvement', 'security')),
  importance VARCHAR(20) DEFAULT 'normal' CHECK (importance IN ('normal', 'important', 'critical')),
  release_date DATE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Tabela de imagens/screenshots das atualizações
CREATE TABLE public.system_update_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID REFERENCES public.system_updates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de leituras (para badge de novidades não lidas)
CREATE TABLE public.user_update_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  update_id UUID REFERENCES public.system_updates(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, update_id)
);

-- Índices para performance
CREATE INDEX idx_system_updates_published ON public.system_updates(is_published, release_date DESC);
CREATE INDEX idx_system_updates_category ON public.system_updates(category);
CREATE INDEX idx_user_update_reads_user ON public.user_update_reads(user_id);
CREATE INDEX idx_system_update_images_update ON public.system_update_images(update_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_system_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_system_updates_updated_at
  BEFORE UPDATE ON public.system_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_updates_updated_at();

-- RLS para system_updates
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

-- Master admin pode tudo
CREATE POLICY "master_admin_full_access_system_updates" ON public.system_updates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

-- Usuários autenticados (exceto customer) podem ver publicados
CREATE POLICY "authenticated_view_published_updates" ON public.system_updates
  FOR SELECT USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master_admin', 'store_admin', 'salesperson', 'delivery_driver', 'attendant')
    )
  );

-- RLS para system_update_images
ALTER TABLE public.system_update_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_admin_full_access_update_images" ON public.system_update_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "authenticated_view_update_images" ON public.system_update_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.system_updates su 
      WHERE su.id = update_id AND su.is_published = true
    ) AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('master_admin', 'store_admin', 'salesperson', 'delivery_driver', 'attendant')
    )
  );

-- RLS para user_update_reads
ALTER TABLE public.user_update_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_reads" ON public.user_update_reads
  FOR ALL USING (user_id = auth.uid());

-- Storage bucket para screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-update-images', 'system-update-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "master_admin_upload_update_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'system-update-images' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "master_admin_delete_update_images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'system-update-images' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
  );

CREATE POLICY "public_view_update_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'system-update-images');