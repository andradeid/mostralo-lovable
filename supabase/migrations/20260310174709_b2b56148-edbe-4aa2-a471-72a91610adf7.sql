-- Tabela para armazenar configurações da UaZapi
CREATE TABLE public.uazapi_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_url TEXT NOT NULL DEFAULT '',
  admin_token TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  connection_status TEXT NOT NULL DEFAULT 'unknown',
  max_instances INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uazapi_config ENABLE ROW LEVEL SECURITY;

-- Apenas master_admin pode acessar
CREATE POLICY "Master admin can manage uazapi_config"
ON public.uazapi_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'master_admin'))
WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Trigger para updated_at
CREATE TRIGGER update_uazapi_config_updated_at
BEFORE UPDATE ON public.uazapi_config
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_updated_at();