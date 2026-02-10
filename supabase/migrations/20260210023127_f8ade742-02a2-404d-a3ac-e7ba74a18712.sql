
-- Tabela de configuração global de marketing da plataforma
CREATE TABLE public.platform_marketing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_ads_id TEXT,
  google_ads_conversion_label TEXT,
  facebook_pixel_id TEXT,
  google_analytics_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.platform_marketing_config ENABLE ROW LEVEL SECURITY;

-- Apenas master_admin pode ler
CREATE POLICY "master_admin_select_platform_marketing"
ON public.platform_marketing_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode inserir
CREATE POLICY "master_admin_insert_platform_marketing"
ON public.platform_marketing_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode atualizar
CREATE POLICY "master_admin_update_platform_marketing"
ON public.platform_marketing_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode deletar
CREATE POLICY "master_admin_delete_platform_marketing"
ON public.platform_marketing_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_platform_marketing_config_updated_at
BEFORE UPDATE ON public.platform_marketing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registro inicial vazio
INSERT INTO public.platform_marketing_config (google_ads_id, google_ads_conversion_label, facebook_pixel_id, google_analytics_id)
VALUES (NULL, NULL, NULL, NULL);
