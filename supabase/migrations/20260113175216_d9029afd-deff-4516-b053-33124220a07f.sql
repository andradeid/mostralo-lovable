-- Criar tabela para armazenar configurações do Google OAuth
CREATE TABLE public.google_oauth_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.google_oauth_config ENABLE ROW LEVEL SECURITY;

-- Apenas master_admin pode ver as configurações
CREATE POLICY "Master admin can view google oauth config"
ON public.google_oauth_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode inserir configurações
CREATE POLICY "Master admin can insert google oauth config"
ON public.google_oauth_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode atualizar configurações
CREATE POLICY "Master admin can update google oauth config"
ON public.google_oauth_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Apenas master_admin pode deletar configurações
CREATE POLICY "Master admin can delete google oauth config"
ON public.google_oauth_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_google_oauth_config_updated_at
BEFORE UPDATE ON public.google_oauth_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();