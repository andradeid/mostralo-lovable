-- Criar tabela system_banners para banners globais do Master Admin
CREATE TABLE public.system_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'orders_page',
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_banners ENABLE ROW LEVEL SECURITY;

-- Política: Apenas master_admin pode gerenciar (CRUD completo)
CREATE POLICY "Master admin full access on system_banners"
ON public.system_banners
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'master_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'master_admin'
  )
);

-- Política: Todos autenticados podem ver banners ativos
CREATE POLICY "Authenticated users can view active system_banners"
ON public.system_banners
FOR SELECT
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_banners_updated_at
  BEFORE UPDATE ON public.system_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();