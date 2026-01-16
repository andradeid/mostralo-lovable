-- Tabela para guardar a ordem personalizada do menu do admin
CREATE TABLE public.admin_menu_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id)
);

-- Enable RLS
ALTER TABLE public.admin_menu_preferences ENABLE ROW LEVEL SECURITY;

-- Policies - apenas o próprio admin pode ver/editar suas preferências
CREATE POLICY "Admins can view their own menu preferences"
ON public.admin_menu_preferences
FOR SELECT
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can insert their own menu preferences"
ON public.admin_menu_preferences
FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their own menu preferences"
ON public.admin_menu_preferences
FOR UPDATE
USING (auth.uid() = admin_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_menu_preferences_updated_at
BEFORE UPDATE ON public.admin_menu_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();