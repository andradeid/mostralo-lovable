-- Tabela para armazenar sobrescritas de status/prioridade/ordem das ideias
CREATE TABLE public.admin_idea_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id INTEGER NOT NULL UNIQUE,
  status TEXT,
  priority TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.admin_idea_overrides ENABLE ROW LEVEL SECURITY;

-- Apenas master_admin pode acessar
CREATE POLICY "Master admin full access on admin_idea_overrides"
ON public.admin_idea_overrides
FOR ALL
USING (has_role(auth.uid(), 'master_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'master_admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_idea_overrides_updated_at
BEFORE UPDATE ON public.admin_idea_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();