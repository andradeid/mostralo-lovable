-- Tabela de tarefas diárias configuráveis
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('prospeccao', 'follow_up', 'marketing', 'desenvolvimento', 'fe')),
  title TEXT NOT NULL,
  description TEXT,
  target_quantity INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_daily_tasks_admin_id ON public.daily_tasks(admin_id);
CREATE INDEX idx_daily_tasks_active ON public.daily_tasks(is_active) WHERE is_active = true;

-- Tabela de conclusões diárias
CREATE TABLE IF NOT EXISTS public.daily_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_quantity INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, date)
);

-- Índices para performance
CREATE INDEX idx_task_completions_admin_date ON public.daily_task_completions(admin_id, date);
CREATE INDEX idx_task_completions_task_date ON public.daily_task_completions(task_id, date);

-- Tabela de versículos bíblicos
CREATE TABLE IF NOT EXISTS public.bible_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_text TEXT NOT NULL,
  reference TEXT NOT NULL,
  book TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('diligencia', 'preguica', 'planejamento', 'perseveranca', 'fe', 'prosperidade', 'comunicacao')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por categoria
CREATE INDEX idx_bible_verses_category ON public.bible_verses(category) WHERE is_active = true;

-- RLS Policies para daily_tasks
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can manage their daily tasks"
  ON public.daily_tasks
  FOR ALL
  USING (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'))
  WITH CHECK (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'));

-- RLS Policies para daily_task_completions
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can manage their task completions"
  ON public.daily_task_completions
  FOR ALL
  USING (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'))
  WITH CHECK (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'));

-- RLS Policies para bible_verses
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can view bible verses"
  ON public.bible_verses
  FOR SELECT
  USING (has_role(auth.uid(), 'master_admin'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_daily_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_tasks_updated_at();

-- Inserir tarefas padrão (usuário pode personalizar depois)
INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'prospeccao',
  'Contatar lojas novas',
  'Fazer primeiro contato com lojas que ainda não conhecem o Mostralo',
  10,
  1
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'prospeccao',
  'Fazer ligações de apresentação',
  'Ligar para apresentar o sistema e entender as necessidades',
  5,
  2
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'prospeccao',
  'Enviar mensagens WhatsApp',
  'Mensagens de prospecção para novos leads',
  15,
  3
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'follow_up',
  'Seguir com leads pendentes',
  'Retomar conversas com leads que demonstraram interesse',
  5,
  4
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'follow_up',
  'Responder mensagens rapidamente',
  'Responder todas as mensagens em até 2 horas',
  1,
  5
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'marketing',
  'Postar nas redes sociais',
  'Publicar conteúdo sobre o Mostralo nas redes',
  1,
  6
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'desenvolvimento',
  'Estudar sobre vendas',
  'Ler artigos, assistir vídeos ou fazer curso sobre vendas',
  1,
  7
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'fe',
  'Oração matinal',
  'Começar o dia com oração pedindo sabedoria e direção',
  1,
  8
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'fe',
  'Ler versículo do dia',
  'Meditar em um versículo bíblico',
  1,
  9
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_tasks (admin_id, category, title, description, target_quantity, display_order)
SELECT 
  p.id,
  'fe',
  'Gratidão',
  'Agradecer por 3 coisas específicas do dia',
  1,
  10
FROM profiles p
WHERE p.user_type = 'master_admin'
ON CONFLICT DO NOTHING;