-- Tabela de metas do admin
CREATE TABLE IF NOT EXISTS admin_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('conservative', 'realistic', 'aggressive', 'ultra')),
  target_stores_per_month INTEGER NOT NULL,
  target_mrr NUMERIC NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de progresso diário
CREATE TABLE IF NOT EXISTS admin_goals_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES admin_goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  new_stores_count INTEGER NOT NULL DEFAULT 0,
  current_mrr NUMERIC NOT NULL DEFAULT 0,
  target_mrr NUMERIC NOT NULL DEFAULT 0,
  progress_percentage NUMERIC NOT NULL DEFAULT 0,
  is_goal_met BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id, date)
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS admin_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_goals_admin_id ON admin_goals(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_goals_progress_admin_id ON admin_goals_progress(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_goals_progress_date ON admin_goals_progress(date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_achievements_admin_id ON admin_achievements(admin_id);

-- RLS Policies para admin_goals
ALTER TABLE admin_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can manage their own goals"
ON admin_goals
FOR ALL
TO authenticated
USING (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'::app_role))
WITH CHECK (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'::app_role));

-- RLS Policies para admin_goals_progress
ALTER TABLE admin_goals_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can view their own progress"
ON admin_goals_progress
FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "System can insert progress"
ON admin_goals_progress
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies para admin_achievements
ALTER TABLE admin_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can view their achievements"
ON admin_achievements
FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "System can insert achievements"
ON admin_achievements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_update_admin_goals_updated_at
BEFORE UPDATE ON admin_goals
FOR EACH ROW
EXECUTE FUNCTION update_admin_goals_updated_at();